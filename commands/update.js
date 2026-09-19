const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, {
            windowsHide: true,
            maxBuffer: 20 * 1024 * 1024
        }, (err, stdout, stderr) => {
            if (err) {
                return reject(
                    new Error((stderr || stdout || err.message || '').toString())
                );
            }

            resolve((stdout || '').toString());
        });
    });
}

/* =========================
   GIT
========================= */

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');

    if (!fs.existsSync(gitDir)) {
        return false;
    }

    try {
        await run('git --version');
        await run('git rev-parse --is-inside-work-tree');
        return true;
    } catch {
        return false;
    }
}

async function updateViaGit() {
    const oldRev = (
        await run('git rev-parse HEAD').catch(() => 'unknown')
    ).trim();

    // Get latest GitHub changes
    await run('git fetch origin main --prune');

    const newRev = (
        await run('git rev-parse origin/main')
    ).trim();

    const alreadyUpToDate = oldRev === newRev;

    let commits = '';
    let files = '';

    if (!alreadyUpToDate && oldRev !== 'unknown') {
        commits = await run(
            `git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`
        ).catch(() => '');

        files = await run(
            `git diff --name-status ${oldRev} ${newRev}`
        ).catch(() => '');
    }

    /*
     * IMPORTANT:
     *
     * Do NOT use:
     *
     * git clean -fd
     *
     * because it can delete runtime folders such as:
     * data/
     * session/
     * tmp/
     * temp/
     *
     * git reset --hard updates tracked source files,
     * including new/changed commands.
     */
    await run(`git reset --hard ${newRev}`);

    return {
        oldRev,
        newRev,
        alreadyUpToDate,
        commits,
        files
    };
}

/* =========================
   DOWNLOAD
========================= */

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 5) {
                return reject(new Error('Too many redirects'));
            }

            visited.add(url);

            const client = url.startsWith('https://')
                ? require('https')
                : require('http');

            const req = client.get(url, {
                headers: {
                    'User-Agent': 'MegaBot-Updater/2.0',
                    'Accept': '*/*'
                }
            }, res => {

                // Redirect
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;

                    if (!location) {
                        return reject(
                            new Error(`HTTP ${res.statusCode} without Location`)
                        );
                    }

                    const nextUrl = new URL(location, url).toString();

                    res.resume();

                    return downloadFile(
                        nextUrl,
                        dest,
                        visited
                    ).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(
                        new Error(`HTTP ${res.statusCode}`)
                    );
                }

                const file = fs.createWriteStream(dest);

                res.pipe(file);

                file.on('finish', () => {
                    file.close(resolve);
                });

                file.on('error', err => {
                    try {
                        file.close(() => {});
                    } catch {}

                    fs.unlink(dest, () => reject(err));
                });
            });

            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });

        } catch (e) {
            reject(e);
        }
    });
}

/* =========================
   ZIP EXTRACTION
========================= */

async function extractZip(zipPath, outDir) {

    // Windows
    if (process.platform === 'win32') {
        const cmd =
            `powershell -NoProfile -Command ` +
            `"Expand-Archive -Path '${zipPath}' ` +
            `-DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;

        await run(cmd);
        return;
    }

    // unzip
    try {
        await run('command -v unzip');
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}

    // 7zip
    try {
        await run('command -v 7z');
        await run(`7z x -y '${zipPath}' -o'${outDir}'`);
        return;
    } catch {}

    // busybox
    try {
        await run('busybox unzip -h');
        await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}

    throw new Error(
        'No system unzip tool found (unzip/7z/busybox).'
    );
}

/* =========================
   RECURSIVE COPY
========================= */

function copyRecursive(
    src,
    dest,
    ignore = [],
    relative = '',
    outList = []
) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    for (const entry of fs.readdirSync(src)) {

        if (ignore.includes(entry)) {
            continue;
        }

        const source = path.join(src, entry);
        const target = path.join(dest, entry);

        const stat = fs.lstatSync(source);

        if (stat.isDirectory()) {

            copyRecursive(
                source,
                target,
                ignore,
                path.join(relative, entry),
                outList
            );

        } else {

            fs.copyFileSync(source, target);

            if (outList) {
                outList.push(
                    path
                        .join(relative, entry)
                        .replace(/\\/g, '/')
                );
            }
        }
    }
}

/* =========================
   ZIP UPDATE
========================= */

async function updateViaZip(
    sock,
    chatId,
    message,
    zipOverride
) {
    const zipUrl = (
        zipOverride ||
        settings.updateZipUrl ||
        process.env.UPDATE_ZIP_URL ||
        ''
    ).trim();

    if (!zipUrl) {
        throw new Error(
            'No ZIP URL configured. Set settings.updateZipUrl or UPDATE_ZIP_URL env.'
        );
    }

    const tmpDir = path.join(process.cwd(), 'tmp');

    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const zipPath = path.join(
        tmpDir,
        'update.zip'
    );

    const extractTo = path.join(
        tmpDir,
        'update_extract'
    );

    // Download
    await downloadFile(
        zipUrl,
        zipPath
    );

    // Remove previous extraction
    if (fs.existsSync(extractTo)) {
        fs.rmSync(
            extractTo,
            {
                recursive: true,
                force: true
            }
        );
    }

    await extractZip(
        zipPath,
        extractTo
    );

    /*
     * GitHub ZIP normally looks like:
     *
     * OUT-LAW-main/
     * ├── commands/
     * ├── lib/
     * ├── index.js
     * └── package.json
     */

    const entries = fs.readdirSync(
        extractTo
    );

    let srcRoot = extractTo;

    if (entries.length === 1) {
        const possibleRoot = path.join(
            extractTo,
            entries[0]
        );

        if (
            fs.existsSync(possibleRoot) &&
            fs.lstatSync(possibleRoot).isDirectory()
        ) {
            srcRoot = possibleRoot;
        }
    }

    /*
     * Runtime folders/files that must NOT
     * be replaced by the GitHub update.
     */
    const ignore = [
        'node_modules',
        '.git',
        'session',
        'session_backup',
        'tmp',
        'temp',
        'data',
        'baileys_store.json'
    ];

    const copied = [];

    /* =========================
       PRESERVE OWNER SETTINGS
    ========================= */

    let preservedOwner = null;
    let preservedBotOwner = null;

    try {
        const currentSettings = require('../settings');

        if (
            currentSettings &&
            currentSettings.ownerNumber
        ) {
            preservedOwner = String(
                currentSettings.ownerNumber
            );
        }

        if (
            currentSettings &&
            currentSettings.botOwner
        ) {
            preservedBotOwner = String(
                currentSettings.botOwner
            );
        }

    } catch {}

    /* =========================
       COPY NEW BOT FILES
    ========================= */

    copyRecursive(
        srcRoot,
        process.cwd(),
        ignore,
        '',
        copied
    );

    /* =========================
       RESTORE OWNER
    ========================= */

    if (preservedOwner) {
        try {
            const settingsPath = path.join(
                process.cwd(),
                'settings.js'
            );

            if (fs.existsSync(settingsPath)) {

                let text = fs.readFileSync(
                    settingsPath,
                    'utf8'
                );

                text = text.replace(
                    /ownerNumber:\s*['"][^'"]*['"]/,
                    `ownerNumber: '${preservedOwner}'`
                );

                if (preservedBotOwner) {
                    text = text.replace(
                        /botOwner:\s*['"][^'"]*['"]/,
                        `botOwner: '${preservedBotOwner}'`
                    );
                }

                fs.writeFileSync(
                    settingsPath,
                    text
                );
            }

        } catch {}
    }

    /* =========================
       CLEAN TEMP FILES
    ========================= */

    try {
        fs.rmSync(
            extractTo,
            {
                recursive: true,
                force: true
            }
        );
    } catch {}

    try {
        fs.rmSync(
            zipPath,
            {
                force: true
            }
        );
    } catch {}

    return {
        copiedFiles: copied
    };
}

/* =========================
   RESTART
========================= */

async function restartProcess(
    sock,
    chatId,
    message
) {
    try {
        await sock.sendMessage(
            chatId,
            {
                text: '✅ Update complete! Restarting…'
            },
            {
                quoted: message
            }
        );
    } catch {}

    // PM2
    try {
        await run('pm2 restart all');
        return;
    } catch {}

    // Panel auto restart
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

/* =========================
   UPDATE COMMAND
========================= */

async function updateCommand(
    sock,
    chatId,
    message,
    zipOverride
) {
    const senderId =
        message.key.participant ||
        message.key.remoteJid;

    const isOwner =
        await isOwnerOrSudo(
            senderId,
            sock,
            chatId
        );

    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(
            chatId,
            {
                text:
                    'Only bot owner or sudo can use .update'
            },
            {
                quoted: message
            }
        );

        return;
    }

    try {

        await sock.sendMessage(
            chatId,
            {
                text:
                    '🔄 Updating the bot, please wait…'
            },
            {
                quoted: message
            }
        );

        /* =========================
           GIT MODE
        ========================= */

        if (await hasGitRepo()) {

            const result =
                await updateViaGit();

            console.log(
                '[update] Old revision:',
                result.oldRev
            );

            console.log(
                '[update] New revision:',
                result.newRev
            );

            if (result.files) {
                console.log(
                    '[update] Changed files:\n' +
                    result.files
                );
            }

            if (result.commits) {
                console.log(
                    '[update] New commits:\n' +
                    result.commits
                );
            }

            /* =========================
               INSTALL DEPENDENCIES
            ========================= */

            await run(
                'npm install --no-audit --no-fund'
            );

        } else {

            /* =========================
               ZIP MODE
            ========================= */

            const result =
                await updateViaZip(
                    sock,
                    chatId,
                    message,
                    zipOverride
                );

            console.log(
                `[update] Copied ${result.copiedFiles.length} files`
            );

            await run(
                'npm install --no-audit --no-fund'
            ).catch(err => {
                console.log(
                    '[update] npm install warning:',
                    err.message
                );
            });
        }

        /* =========================
           DONE
        ========================= */

        await sock.sendMessage(
            chatId,
            {
                text:
                    '✅ Update done.\n🔄 Restarting…'
            },
            {
                quoted: message
            }
        );

        await restartProcess(
            sock,
            chatId,
            message
        );

    } catch (err) {

        console.error(
            '[update] Update failed:',
            err
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ Update failed:\n${String(
                        err.message || err
                    )}`
            },
            {
                quoted: message
            }
        );
    }
}

module.exports = updateCommand;
