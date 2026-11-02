// PreToolUse(Bash, PowerShell): 금지된 패키지 매니저와 위험한 git push 를 막는다.
// exit 2 + stderr 는 Claude 에게 차단 사유로 전달된다.
import { execFileSync } from "node:child_process";

const PROTECTED_BRANCHES = ["main", "develop"];
const COMMAND_START = String.raw`(?:^|[;&|(\n]|\$\()\s*`;
const PACKAGE_MANAGER = new RegExp(
	`${COMMAND_START}(npm|npx|yarn|pnpm|pnpx)(?:\\.cmd|\\.exe)?(?=\\s|$)`,
	"m",
);
const GIT_PUSH = new RegExp(`${COMMAND_START}git(?:\\s+-C\\s+\\S+)?\\s+push\\b([^;&|\\n]*)`, "gm");

function block(reason: string): never {
	process.stderr.write(`[cavac guard] ${reason}\n`);
	process.exit(2);
}

function getCurrentBranch(): string {
	try {
		return execFileSync("git", ["branch", "--show-current"], {
			cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
			encoding: "utf8",
		}).trim();
	} catch {
		return "";
	}
}

function checkGitPush(args: string): void {
	const tokens = args
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((token) => token.replace(/^["']|["']$/g, ""));
	const isForce = tokens.some(
		(token) =>
			token === "-f" ||
			token.startsWith("--force") ||
			(/^-[a-zA-Z]+$/.test(token) && token.includes("f")) ||
			token.startsWith("+"),
	);
	if (isForce) {
		block("강제 push 는 금지입니다. 히스토리를 다시 쓰지 말고 새 커밋으로 해결하세요.");
	}

	const positionals = tokens.filter((token) => !token.startsWith("-"));
	const refspecs = positionals.slice(1);
	const targetsProtected = refspecs.some((refspec) => {
		const target = refspec.split(":").pop()?.replace(/^refs\/heads\//, "") ?? "";
		return PROTECTED_BRANCHES.includes(target);
	});
	const isImplicitProtected =
		refspecs.length === 0 && PROTECTED_BRANCHES.includes(getCurrentBranch());
	if (targetsProtected || isImplicitProtected) {
		block(
			"main/develop 에 직접 push 할 수 없습니다. `#{이슈번호}-{종류}-{작업설명}` 브랜치에서 PR 로 병합하세요.",
		);
	}
}

const input = JSON.parse(await new Response(Bun.stdin.stream()).text());
const command: string = input?.tool_input?.command ?? "";

const packageManager = command.match(PACKAGE_MANAGER)?.[1];
if (packageManager) {
	block(`\`${packageManager}\` 는 금지입니다. 패키지 매니저는 bun 하나입니다 (bun, bunx, bun run).`);
}

for (const match of command.matchAll(GIT_PUSH)) {
	checkGitPush(match[1] ?? "");
}
