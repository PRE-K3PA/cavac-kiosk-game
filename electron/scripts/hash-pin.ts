import { stderr, stdin } from "node:process";
import { createInterface } from "node:readline";
import { isValidPin } from "../main/pin";
import { hashPin } from "../main/pin-hash";

// 마스터 PIN 해시를 만듭니다. 셸 기록에 남지 않도록 인자 대신 입력으로 받지만, 입력한 숫자는 화면에 보입니다
// 안내 문구는 stderr 로 보내서, 결과 줄만 stdout 에 남깁니다
stderr.write("PIN (숫자 4자리): ");
const reader = createInterface({ input: stdin });
let pin = "";
// 줄바꿈 없이 입력이 끝나도 멈추지 않도록 첫 줄만 읽고 닫습니다
for await (const line of reader) {
	pin = line.trim();
	break;
}
reader.close();

if (!isValidPin(pin)) {
	console.error("숫자 4자리를 입력해 주세요.");
	process.exit(1);
}
console.log(`MASTER_PIN_HASH=${await hashPin(pin)}`);
console.error(
	"위 줄을 저장소 루트의 .env.local 에 넣고 빌드하세요. 원문과 해시를 커밋하지 마세요.",
);
