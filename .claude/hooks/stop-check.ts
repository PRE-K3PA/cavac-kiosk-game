// Stop: 코드 변경이 있으면 `bun run check` 와 `bun run typecheck` 를 돌린다.
// 실패하면 exit 2 로 Claude 가 멈추지 않고 원인을 고치게 한다. (.kiro 의 agent-stop-check 와 같은 역할)
// 마지막으로 통과한 변경 상태와 같으면 다시 돌리지 않는다.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const CODE_PATH = /^(src|electron)\/|^[^/]+\.(ts|tsx|json|css|html)$/;
const OUTPUT_LIMIT = 4000;

function git(args: string[]): string {
	return execFileSync("git", args, { cwd: projectDir, encoding: "utf8" });
}

function getChangedCodeFiles(): string[] {
	return git(["status", "--porcelain", "--untracked-files=all"])
		.split("\n")
		.map((line) => line.slice(3).trim().replace(/^"|"$/g, ""))
		.map((path) => path.split(" -> ").pop() ?? path)
		.filter((path) => CODE_PATH.test(path));
}

function getFingerprint(files: string[]): string {
	const hash = createHash("sha256").update(git(["diff", "HEAD"]));
	for (const file of files) {
		const fullPath = join(projectDir, file);
		hash.update(file);
		if (existsSync(fullPath)) {
			hash.update(readFileSync(fullPath));
		}
	}
	return hash.digest("hex");
}

function run(script: string): { isPassed: boolean; output: string } {
	const result = spawnSync("bun", ["run", script], {
		cwd: projectDir,
		encoding: "utf8",
		shell: process.platform === "win32",
	});
	return { isPassed: result.status === 0, output: `${result.stdout}${result.stderr}` };
}

const input = JSON.parse(await new Response(Bun.stdin.stream()).text());
if (input?.stop_hook_active) {
	process.exit(0);
}

const changedFiles = getChangedCodeFiles();
if (changedFiles.length === 0) {
	process.exit(0);
}

const cacheFile = join(
	tmpdir(),
	`cavac-stop-check-${createHash("sha256").update(projectDir).digest("hex").slice(0, 12)}`,
);
const fingerprint = getFingerprint(changedFiles);
if (existsSync(cacheFile) && readFileSync(cacheFile, "utf8") === fingerprint) {
	process.exit(0);
}

for (const script of ["check", "typecheck"]) {
	const { isPassed, output } = run(script);
	if (!isPassed) {
		process.stderr.write(
			`[cavac stop-check] \`bun run ${script}\` 실패. 우회하지 말고 원인을 고치세요.\n` +
				output.slice(-OUTPUT_LIMIT),
		);
		process.exit(2);
	}
}

writeFileSync(cacheFile, fingerprint);
