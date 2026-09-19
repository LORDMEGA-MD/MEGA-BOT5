/*
 * commands/auto/owner/file.js
 *
 * Full Bash-style owner/sudo file command.
 *
 * Examples:
 *
 *   .file ls
 *   .file ls commands
 *   .file pwd
 *   .file cat package.json
 *   .file grep -R "newsletter" .
 *   .file find . -name "*.js"
 *   .file git status
 *   .file git pull
 *   .file npm install
 *   .file node index.js
 *
 * "ls" keeps the original 📁 / 📄 representation.
 *
 * Session/auth modification is blocked.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const MAX_OUTPUT = 15000;
const TIMEOUT = 30000;

/*
 * Add your actual Baileys/session directory names here if needed.
 */
const SESSION_PATTERNS = [
    /session/i,
    /sessions/i,
    /auth[_-]?info/i,
    /auth[_-]?state/i,
    /creds\.json/i,
    /app[_-]?state/i,
    /sender[_-]?key/i,
    /pre[_-]?key/i,
    /signal[_-]?key/i
];

/*
 * Resolve a path relative to the project.
 */
function resolveProjectPath(input = '.') {
    const clean = String(input)
        .trim()
        .replace(/^['"]|['"]$/g, '');

    const resolved = path.resolve(PROJECT_ROOT, clean);

    if (
        resolved !== PROJECT_ROOT &&
        !resolved.startsWith(PROJECT_ROOT + path.sep)
    ) {
        return null;
    }

    return resolved;
}

/*
 * Check whether a path points at session/authentication data.
 */
function isSessionPath(input) {
    return SESSION_PATTERNS.some(pattern =>
        pattern.test(String(input))
    );
}

/*
 * Detect direct shell modification of session data.
 */
function blocksSessionModification(command) {
    const lower = command.toLowerCase();

    if (!SESSION_PATTERNS.some(pattern => pattern.test(lower))) {
        return false;
    }

    /*
     * Redirection:
     *
     * echo x > session/file
     * echo x >> creds.json
     */
    if (/[<>]{1,2}/.test(command)) {
        return true;
    }

    /*
     * Direct filesystem modification commands.
     */
    const modifyingCommands = [
        /\brm\b/i,
        /\brmdir\b/i,
        /\bmv\b/i,
        /\bcp\b/i,
        /\binstall\b/i,
        /\btouch\b/i,
        /\bmkdir\b/i,
        /\btruncate\b/i,
        /\btee\b/i,
        /\bsed\s+-i\b/i,
        /\bperl\s+-i\b/i,
        /\bchmod\b/i,
        /\bchown\b/i,
        /\bln\b/i
    ];

    if (modifyingCommands.some(re => re.test(command))) {
        return true;
    }

    /*
     * Git operations that can alter files.
     */
    if (
        /\bgit\s+(checkout|restore|reset|clean|apply|merge|pull|switch)\b/i
            .test(command)
    ) {
        return true;
    }

    return false;
}

/*
 * Original directory/file representation.
 *
 * 📁 directory/
 * 📄 file
 */
function formattedLs(target) {
    const entries = fs.readdirSync(target, {
        withFileTypes: true
    });

    entries.sort((a, b) => {
        /*
         * Directories first, then files.
         */
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;

        return a.name.localeCompare(
            b.name,
            undefined,
            {
                numeric: true,
                sensitivity: 'base'
            }
        );
    });

    if (!entries.length) {
        return '(empty directory)';
    }

    return entries
        .map(entry => {
            if (entry.isDirectory()) {
                return `📁 ${entry.name}/`;
            }

            return `📄 ${entry.name}`;
        })
        .join('\n');
}

/*
 * Parse simple ls targets.
 *
 * Examples:
 *
 * ls
 * ls commands
 * ls commands/auto
 *
 * For normal "ls" we use our formatted representation.
 */
function handleLs(command) {
    const parts = command.trim().split(/\s+/);

    /*
     * Only use custom formatting for simple ls.
     *
     * .file ls
     * .file ls directory
     *
     * Commands such as:
     *
     * ls -la
     * ls -R
     *
     * are passed to Bash instead.
     */
    if (parts[0] !== 'ls') {
        return null;
    }

    if (parts.length > 2) {
        return null;
    }

    if (parts.length === 2 && parts[1].startsWith('-')) {
        return null;
    }

    const target = parts[1] || '.';
    const resolved = resolveProjectPath(target);

    if (!resolved) {
        return '🚫 Path outside project directory blocked.';
    }

    try {
        const stat = fs.statSync(resolved);

        if (!stat.isDirectory()) {
            return '📄 ' + path.basename(resolved);
        }

        return formattedLs(resolved);

    } catch (err) {
        return `Error: ${err.message}`;
    }
}

/*
 * Execute Bash.
 */
function execute(command) {
    return new Promise(resolve => {
        exec(
            command,
            {
                cwd: PROJECT_ROOT,
                shell: '/bin/bash',

                timeout: TIMEOUT,

                maxBuffer: 2 * 1024 * 1024,

                env: {
                    ...process.env,
                    PWD: PROJECT_ROOT
                }
            },

            (error, stdout, stderr) => {
                let output = '';

                if (stdout) {
                    output += stdout;
                }

                if (stderr) {
                    if (output && !output.endsWith('\n')) {
                        output += '\n';
                    }

                    output += stderr;
                }

                output = output.trim();

                if (!output) {
                    if (error) {
                        output =
                            error.message ||
                            'Command failed.';
                    } else {
                        output =
                            'Command completed successfully.';
                    }
                }

                resolve(output);
            }
        );
    });
}

module.exports = async function fileCommand(
    sock,
    chatId,
    message,
    args,
    userMessage
) {
    const command = args.join(' ').trim();

    if (!command) {
        return sock.sendMessage(
            chatId,
            {
                text:
`Bash terminal

📍 ${PROJECT_ROOT}

Examples:

.file ls
.file ls commands
.file pwd
.file cat package.json
.file grep -R "newsletter" .
.file find . -name "*.js"
.file git status
.file git pull
.file npm install
.file node index.js
.file mkdir test
.file touch test.js
.file rm test.js

Full Bash commands are supported.

🔒 Direct session modification is blocked.`
            },
            { quoted: message }
        );
    }

    try {
        /*
         * Session protection.
         */
        if (blocksSessionModification(command)) {
            return sock.sendMessage(
                chatId,
                {
                    text:
`🚫 Session modification blocked.

This command appears to modify WhatsApp
authentication/session data.

Reading is allowed.
Direct modification/deletion/moving/copying
is blocked.`
                },
                { quoted: message }
            );
        }

        /*
         * Keep the original ls representation.
         */
        const lsResult = handleLs(command);

        if (lsResult !== null) {
            return sock.sendMessage(
                chatId,
                {
                    text: lsResult
                },
                { quoted: message }
            );
        }

        /*
         * Everything else goes through Bash.
         */
        const result = await execute(command);

        const output =
            result.length > MAX_OUTPUT
                ? result.slice(0, MAX_OUTPUT) +
                  '\n\n...[output truncated]'
                : result;

        return sock.sendMessage(
            chatId,
            {
                text: output
            },
            { quoted: message }
        );

    } catch (err) {
        return sock.sendMessage(
            chatId,
            {
                text: `Error: ${err.message}`
            },
            { quoted: message }
        );
    }
};