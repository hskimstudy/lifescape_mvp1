export const FAQ_DATA = [
    {
        id: 0,
        q: "생성된 사진은 상업적으로 사용해도 되나요?",
        a: "네, 가능해요. 생성된 이미지는 쇼핑몰 상세페이지, 광고, SNS 등 상업적 용도로 자유롭게 사용할 수 있어요. 단, 업로드한 원본 이미지 및 참조 이미지에 대한 권리는 사용자에게 있으며, 이에 대한 책임 또한 이용자에게 있어요."
    },
    {
        id: 1,
        q: "어떤 사진을 업로드해야 가장 잘 나오나요?",
        a: "가구 제품만 보이는 사진을 업로드하는 것이 가장 좋아아요. 제품이 전체가 선명하게 보이는 사진일수록 더 좋은 결과물이 생성돼요. 또한 생성된 이미지는 입력된 가구의 각도와 크기를 기준으로 만들어져요."
    },
    {
        id: 2,
        q: "어떤 이미지를 참조 이미지로 사용할 수 있나요?",
        a: "참조 이미지는 직접 촬영했거나 사용 권한이 있는 이미지만 업로드할 수 있습니다. 저작권이 있는 이미지나 사용 권한이 없는 사진을 사용할 경우 발생하는 책임은 이용자에게 있습니다."
    },
    {
        id: 3,
        q: "고해상도 이미지도 받아볼 수 있을까요?",
        a: "스튜디오 플랜으로 신청하시면 고해상도 이미지를 제공해드리고 있어요!"
    }
];

export const PRICING_DATA = [
    {
        id: 'basic',
        icon: '🪙',
        name: '싱글 플랜',
        originalPrice: '30,000원',
        price: '24,900원',
        features: [
            { text: '크레딧 50개 지급', active: true, bold: true },
            { text: '초고화질 이미지 제공', active: false, bold: false },
            { text: '상세 페이지 제작', active: false, bold: false },
            { text: '자사몰 제작', active: false, bold: false },
        ]
    },
    {
        id: 'pro',
        icon: '🪙',
        name: '스튜디오 플랜',
        originalPrice: '300,000원',
        price: '249,000원',
        features: [
            { text: '크레딧 1,000개 지급', active: true, bold: true },
            { text: '초고화질 이미지 제공', active: true, bold: true },
            { text: '상세 페이지 제작', active: false, bold: false },
            { text: '자사몰 제작', active: false, bold: false },
        ]
    },
    {
        id: 'enterprise',
        icon: '🪙',
        name: '엔터프라이즈',
        price: '기업 문의',
        isEnterprise: true,
        features: [
            { text: '대량 SKU를 위한 커스텀 플랜', active: true, bold: true },
            { text: '상세 페이지 제작', active: true, bold: true },
            { text: '자사몰 제작', active: true, bold: true },
            { text: '기타 비즈니스 문의', active: true, bold: true },
        ]
    }
];
