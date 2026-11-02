/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** 개발 중 mock 데이터 상태. filled(기본) 또는 empty(첫 실행) */
	readonly VITE_MOCK_SCENARIO?: "filled" | "empty";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
