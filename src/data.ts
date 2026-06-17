import { DialogueEvent } from './types';

export const YANDERE_IMAGES = {
  neutral: '/src/assets/images/yandere_neutral_1781676154944.jpg',
  happy: '/src/assets/images/yandere_blushing_1781676176973.jpg',
  crazy: '/src/assets/images/yandere_crazy_1781676198567.jpg',
};

export const DIALOGUE_EVENTS: DialogueEvent[] = [
  {
    id: 1,
    question: "「ねえ、さっき別の女の子と並んで歩いてなかった…？ ねえ、あれは誰なの？」",
    options: [
      {
        text: "「ただ道を聞かれただけだよ！僕には君しかいないのに、不安にさせてごめんね」",
        value: 10,
        isSuccess: true,
        response: "「えへへ、道を聞かれただけなんだ…♡ 私だけを見てくれてるって信じてたよ！」",
        reaction: "happy"
      },
      {
        text: "「あ、ただのクラスの女子だけど。何か問題ある？」",
        value: -5,
        isSuccess: false,
        response: "「大ありだよ。ねえ、なんでその子と話したの？その口、もういらないのかな？」",
        reaction: "crazy"
      },
      {
        text: "「（無言で背を向けて走って逃げ出す）」",
        value: -5,
        isSuccess: false,
        response: "「逃げるんだ…？ 私から逃げられると思ってるの？ 捕まえたら、足、折っちゃうよ？」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 2,
    question: "「私のこと、どれくらい好き？ 世界で一番？ それとも死ぬほど？」",
    options: [
      {
        text: "「言葉じゃ足りない。死んでも、魂がすり減っても君だけを愛し続けるよ！」",
        value: 10,
        isSuccess: true,
        response: "「あぁ…！私も！死んでもあなたを離さないっ！ねえ、永遠に溶け合おうね…♡」",
        reaction: "happy"
      },
      {
        text: "「普通に好きだよ。クラスの中では一番可愛いと思ってる」",
        value: -5,
        isSuccess: false,
        response: "「ふつう…？ しかも『クラスの中で』？ なんで他の女と比べてるの？ ねぇ…」",
        reaction: "crazy"
      },
      {
        text: "「ちょっと愛情表現が重すぎて息が詰まるかな…」",
        value: -5,
        isSuccess: false,
        response: "「息が詰まる？…じゃあ、本当に息の根を止めてあげようか？ 楽にしてあげる♡」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 3,
    question: "「ねえ、あなたのスマートフォンの暗証番号教えて？ 全部確認したいの」",
    options: [
      {
        text: "「今すぐ暗証番号を君の誕生日に変えるよ！指紋も顔認証も登録して、いつでも見て！」",
        value: 10,
        isSuccess: true,
        response: "「本当に…？ 隠し事ゼロのあなた、大好き♡ これでいつでも繋がっていられるね！」",
        reaction: "happy"
      },
      {
        text: "「さすがにプライバシーがあるから、教えられないよ」",
        value: -5,
        isSuccess: false,
        response: "「プライバシー…？ 私に隠さなきゃいけないことって何？ 別の泥棒猫からの通知？」",
        reaction: "crazy"
      },
      {
        text: "「何言ってるんだよ。勝手にスマホを見るのは良くないよ」",
        value: -5,
        isSuccess: false,
        response: "「良くないこと…？ 私があなたを管理するのに、何か邪魔をしてるの…？」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 4,
    question: "「さっきから私が投げる包丁を華麗に避けてるよね。…まさか、私から逃げたいの？」",
    options: [
      {
        text: "「逃げるわけないよ！君の愛（刃物）を全身で感じて、近くで見つめていたいだけ！」",
        value: 10,
        isSuccess: true,
        response: "「そっか！私の愛を味わってくれてるんだ！もっと…もっと濃密な愛、投げるね♡」",
        reaction: "happy"
      },
      {
        text: "「当たり前だろ！包丁は当たったら死ぬんだよ、危ないだろう！」",
        value: -5,
        isSuccess: false,
        response: "「死ぬ？死んだら私のものになるのに、何が怖いの？ 私を拒絶しないで！！」",
        reaction: "crazy"
      },
      {
        text: "「助けて！誰か、殺人未遂の凶行を止めて警察を呼んでくれ！」",
        value: -5,
        isSuccess: false,
        response: "「けいさつ…？ 私たちを引き離そうとする不純物は、まず先に消さなきゃねぇ…」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 5,
    question: "「私の手作りの特製スープ、今すぐ飲んで。中に何が入ってるかは…ヒ・ミ・ツ♡」",
    options: [
      {
        text: "「君の特製スープなら毒でも笑顔で飲み干すよ！ゴクゴク、あぁ、凄く甘いね！」",
        value: 10,
        isSuccess: true,
        response: "「ふふ、よく飲んでくれたね♡ あなたの胃袋まで私の愛で満たされて、凄く嬉しいな…♡」",
        reaction: "happy"
      },
      {
        text: "「中に怪しい赤い変な結晶が入ってるし、怖いから遠慮しておく…」",
        value: -5,
        isSuccess: false,
        response: "「私がせっかく作ったのに断るんだ？ …お腹が空いてないなら、もう口を縫い合わせたいな」",
        reaction: "crazy"
      },
      {
        text: "「科学分析にかけてからじゃないと絶対飲めない」",
        value: -5,
        isSuccess: false,
        response: "「科学分析？ 私の愛を疑うなんて最悪だよ。そこまで言うなら無理やりにでも…」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 6,
    question: "「もし私たちの幸せを邪魔する奴が現れたら…消しちゃっていいよね…？」",
    options: [
      {
        text: "「僕たちの間を邪魔する障害は、二人で一緒に地の果てまで排除しよう！」",
        value: 10,
        isSuccess: true,
        response: "「嬉しい…！さすが私のダーリン♡ 二人の愛の邪魔者は、根絶やしにしよ？♡」",
        reaction: "happy"
      },
      {
        text: "「絶対にダメだよ！どんな理由があっても犯罪だし、警察に捕まる！」",
        value: -5,
        isSuccess: false,
        response: "「なんで邪魔する側の肩を持つの？ あなたも裏切る気？ 許さない、絶対に！」",
        reaction: "crazy"
      },
      {
        text: "「もう狂ってる…君は一度カウンセリングか精神科へ行くべきだ」",
        value: -5,
        isSuccess: false,
        response: "「狂ってる？ 狂うほどあなたを愛してるだけなのに！ 病院なんかより私たちの檻で暮らそう？」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 7,
    question: "「ねえ、来世も、再来世も、宇宙が滅びても、ずっとずっと隣にいてくれるよね？」",
    options: [
      {
        text: "「次元を超えて、魂が完璧に融け合っても、ずっと君だけを抱きしめているよ」",
        value: 10,
        isSuccess: true,
        response: "「魂の融合…！なんて素晴らしい響きなの♡ 宇宙の終わりでも、二人ぴったり一緒だね♡」",
        reaction: "happy"
      },
      {
        text: "「来世なんて非科学的だし、今を生きるだけで精一杯だよ……」",
        value: -5,
        isSuccess: false,
        response: "「現実的な男の人って冷めちゃうな…。じゃあ、今すぐ来世に行ってみる？ 連れていくよ」",
        reaction: "crazy"
      },
      {
        text: "「来世はもっと穏やかで平和な、落ち着いた人生を送りたいな」",
        value: -5,
        isSuccess: false,
        response: "「穏やかな人生？…私以外の誰かと幸せになるつもり？ 許さない…来世も絶対に見つけるからね」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 8,
    question: "「あなたがもし私より先に死んだら…私も秒で追いかけるから安心しなさい？」",
    options: [
      {
        text: "「それほど深く愛されているなんて幸せだ！墓穴は一つ、赤い薔薇で満たそう！」",
        value: 10,
        isSuccess: true,
        response: "「素敵！同じお墓で永遠に抱きしめ合うの！誰にも邪魔されない理想の世界だね♡」",
        reaction: "happy"
      },
      {
        text: "「怖いから縁起でもないこと言わないでよ！」",
        value: -5,
        isSuccess: false,
        response: "「怖いってどういうこと？ 私の深い純愛が怖いの？ ひどいよ…心外だな」",
        reaction: "crazy"
      },
      {
        text: "「絶対に追ってこないでくれ。死後くらい解放されたい…」",
        value: -5,
        isSuccess: false,
        response: "「解放されたい？ …私から解放されたいって言ったの…？ 死んでも逃がさないって言ったよね！」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 9,
    question: "「私の部屋、あなたの写真で壁一面埋め尽くしてるんだ。…見に来てくれるよね？」",
    options: [
      {
        text: "「僕の見てない姿まで記録してくれてありがとう！今すぐその部屋の住人になるよ！」",
        value: 10,
        isSuccess: true,
        response: "「えへへ、あなたの全てが私のもの♡ 鎖もしっかり用意して待ってるからね♡」",
        reaction: "happy"
      },
      {
        text: "「うわ、ストーカーみたいで本当に気味が悪いな……」",
        value: -5,
        isSuccess: false,
        response: "「気味が悪い？ …愛をストーカー呼ばわりするなんて。あなたの目、一回洗わなきゃ」",
        reaction: "crazy"
      },
      {
        text: "「これ以上は犯罪。警察に写真の強制撤去を求めます」",
        value: -5,
        isSuccess: false,
        response: "「撤去？ 私の思い出を奪う気？ あなたの指を一本ずつお土産にしちゃうぞ♡」",
        reaction: "crazy"
      }
    ]
  },
  {
    id: 10,
    question: "「ねえ、最後の質問。私のこと、本当に、心の底から、狂おしいほどに、愛してる…？」",
    options: [
      {
        text: "「愛してる！愛してる！愛してる！！君が太陽で僕の呼吸だ！狂うほどに愛してる！！」",
        value: 10,
        isSuccess: true,
        response: "「あぁぁっ…最高の答え！！私たちの愛は完成したんだね！本当に…愛してるっ♡♡」",
        reaction: "happy"
      },
      {
        text: "「…狂ってるのは君だけだよ。まともに恋愛してくれ」",
        value: -5,
        isSuccess: false,
        response: "「まともに？ これが私のまともな愛なの。私を拒否する心臓なんて、今弾き出してあげる！」",
        reaction: "crazy"
      },
      {
        text: "「正直言って、狂暴すぎる君にはもう限界が来ている」",
        value: -5,
        isSuccess: false,
        response: "「限界？ …フフ、じゃあその限界をぶち壊して、完全に私の世界に閉じ込めちゃうね♡」",
        reaction: "crazy"
      }
    ]
  }
];
