// 첫 실행에 등록하는 기본 축종. 이미지는 resources/default-species 에 있고, 이 순서대로 목록에 들어갑니다
// 앞의 8종은 가장 자주 쓰는 동물 순서이고, 나머지는 순서를 따로 정하지 않았습니다
export const DEFAULT_SPECIES: readonly { file: string; name: string }[] = [
	{ file: "pig.png", name: "돼지" },
	{ file: "chicken.png", name: "닭" },
	{ file: "native-chicken.png", name: "토종닭" },
	{ file: "dog.png", name: "강아지" },
	{ file: "cat.png", name: "고양이" },
	{ file: "dairy-cow.png", name: "젖소" },
	{ file: "hanwoo.png", name: "한우" },
	{ file: "wild-boar.png", name: "멧돼지" },
	{ file: "sheep.png", name: "양" },
	{ file: "goat.png", name: "염소" },
	{ file: "black-goat.png", name: "흑염소" },
	{ file: "duck.png", name: "오리" },
	{ file: "raccoon.png", name: "라쿤" },
	{ file: "rabbit.png", name: "토끼" },
	{ file: "horse.png", name: "말" },
	{ file: "raccoon-dog.png", name: "너구리" },
	{ file: "clownfish.png", name: "흰동가리" },
	{ file: "flatfish.png", name: "넙치" },
	{ file: "trout.png", name: "송어" },
];
