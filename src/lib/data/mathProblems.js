// src/lib/data/mathProblems.js
export const mathProblems = [
    {
      "id": 1,
      "question": {
        "text": "다음 중 무한소수를 모두 찾으시오.\n\n가. \\(0.\\dot{3}\\)\n나. \\(0.3876\\)\n다. \\(8.9\\)\n라. \\(4.2\\dot{5}7\\dot{3}\\)\n마. \\(0.\\overline{612}\\)\n바. \\(-1.555\\)",
        "latex": [
          "0.\\dot{3}",
          "0.3876",
          "8.9",
          "4.2\\dot{5}7\\dot{3}",
          "0.\\overline{612}",
          "-1.555"
        ]
      },
      "answer": "가, 라, 마",
      "explanation": null,
      "episode": "무한소수의 뜻"
    },
    {
      "id": 2,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\dfrac{4}{9}\\)",
        "latex": [
          "\\dfrac{4}{9}"
        ]
      },
      "answer": "\\(0.\\dot{4}\\), 무",
      "explanation": "\\(\\dfrac{4}{9}=4÷9=0.\\dot{4}\\)",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 3,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\dfrac{8}{11}\\)",
        "latex": [
          "\\dfrac{8}{11}"
        ]
      },
      "answer": "\\(0.\\overline{72}\\), 무",
      "explanation": "\\(\\dfrac{8}{11}=8÷11=0.\\overline{72}\\)",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 4,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\dfrac{7}{12}\\)",
        "latex": [
          "\\dfrac{7}{12}"
        ]
      },
      "answer": "\\(0.58\\dot{3}\\), 무",
      "explanation": "\\(\\dfrac{7}{12}=7÷12=0.58\\dot{3}\\)",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 5,
      "question": {
        "text": "다음 보기 중 옳은 것을 모두 고르시오.\n\n【보기】\nㄱ. \\(3\\)은 유리수가 아니다.\nㄴ. \\(0.\\overline{34}\\)는 무한소수이다.\nㄷ. \\(\\dfrac{3}{4}\\)을 소수로 나타내면 유한소수이다.\nㄹ. \\(\\dfrac{7}{16}\\)을 소수로 나타내면 무한소수이다.",
        "latex": [
          "3",
          "0.\\overline{34}",
          "\\dfrac{3}{4}",
          "\\dfrac{7}{16}"
        ]
      },
      "answer": "ㄴ, ㄷ",
      "explanation": "ㄱ. \\(3=\\dfrac{3}{1}=\\dfrac{6}{2}=\\cdots\\)이므로 \\(3\\)은 유리수이다.\nㄷ. \\(\\dfrac{3}{4}=3÷4=0.75\\)이므로 유한소수이다.\nㄹ. \\(\\dfrac{7}{16}=7÷16=0.4375\\)이므로 무한소수이다.\n이상에서 옳은 것은 ㄴ, ㄷ이다.",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 6,
      "question": {
        "text": "다음 분수를 소수로 나타낼 때, 무한소수가 되는 것을 모두 고르시오.\n\n【보기】\n\\(\\dfrac{2}{3}\\), \\(\\dfrac{15}{6}\\), \\(\\dfrac{18}{12}\\), \\(\\dfrac{9}{11}\\), \\(\\dfrac{12}{15}\\)",
        "latex": [
          "\\dfrac{2}{3}",
          "\\dfrac{15}{6}",
          "\\dfrac{18}{12}",
          "\\dfrac{9}{11}",
          "\\dfrac{12}{15}"
        ]
      },
      "answer": "\\(\\dfrac{2}{3}\\), \\(\\dfrac{9}{11}\\)",
      "explanation": "\\(\\dfrac{2}{3}=2÷3=0.\\dot{6}\\)(무한소수)\n\\(\\dfrac{15}{6}=15÷6=2.5\\)(유한소수)\n\\(\\dfrac{18}{12}=18÷12=1.5\\)(유한소수)\n\\(\\dfrac{9}{11}=9÷11=0.\\overline{81}\\)(무한소수)\n\\(\\dfrac{12}{15}=12÷15=0.8\\)(유한소수)",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 7,
      "question": {
        "text": "다음 설명 중 옳은 것은 ○표, 옳지 않은 것은 X표를 하시오.\n\n모든 무한소수는 유리수이다.",
        "latex": []
      },
      "answer": "X",
      "explanation": "순환소수가 아닌 무한소수는 유리수가 아니다.",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 8,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 그 소수가 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\mathrm{\\dfrac{4}{9}=\\bbox[2px,border:1px solid #000000;]{\\mathrm{~ﾠ}}}\\)",
        "latex": [
          "\\mathrm{\\dfrac{4}{9}=\\bbox[2px,border:1px solid #000000;]{\\mathrm{~ﾠ}}}"
        ]
      },
      "answer": "\\(0.\\dot{4}\\), 무",
      "explanation": "\\(\\mathrm{\\dfrac{4}{9}=4÷9=\\bbox[2px,border:1px solid #000000;]{\\mathrm{0.\\dot{4}}}}\\)이므로 무한소수이다.",
      "episode": "무한소수의 뜻"
    },
    {
      "id": 9,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 그 소수가 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\dfrac{7}{6}=\\)",
        "latex": [
          "\\dfrac{7}{6}="
        ]
      },
      "answer": "\\(1.1\\dot{6}\\), 무",
      "explanation": null,
      "episode": "무한소수의 뜻"
    },
    {
      "id": 10,
      "question": {
        "text": "다음 분수를 소수로 나타내고, 그 소수가 유한소수이면 '유', 무한소수이면 '무'를 쓰시오.\n\n\\(\\dfrac{2}{11}=\\)",
        "latex": [
          "\\dfrac{2}{11}="
        ]
      },
      "answer": "\\(0.\\overline{18}\\), 무",
      "explanation": null,
      "episode": "무한소수의 뜻"
    }
  ];
  