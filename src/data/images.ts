import type {
	CardGameData,
	CommonData,
	DataFile,
	DataMap,
	ImageKind,
	ImagePath,
	VaccineGameData,
} from "@/types/data";

// 저장할 때 그 설정 파일의 이미지 폴더만 정리해야, 다른 탭에서 등록하고 아직 저장하지 않은 이미지를 지우지 않습니다
export const IMAGE_KINDS_BY_FILE: { [F in DataFile]: readonly ImageKind[] } = {
	common: ["species"],
	"vaccine-game": ["vaccine-bottle", "vaccine-logo"],
	"card-game": ["product"],
};

export function collectImagePaths<F extends DataFile>(file: F, data: DataMap[F]): ImagePath[] {
	switch (file) {
		case "common":
			return (data as CommonData).species.map((species) => species.character);
		case "vaccine-game":
			return (data as VaccineGameData).vaccines.flatMap((vaccine) => [
				vaccine.bottleImage.ko,
				vaccine.bottleImage.en,
				vaccine.logoImage.ko,
				vaccine.logoImage.en,
			]);
		case "card-game":
			return (data as CardGameData).products.flatMap((product) =>
				product.image ? [product.image.ko, product.image.en] : [],
			);
		default:
			return [];
	}
}
