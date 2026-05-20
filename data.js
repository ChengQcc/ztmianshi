// 花颜美妆 · Multi-Agent 客服系统 · 演示场景数据
// 4 个场景对应 simplified_data_access.md 的 4 个实战示例

const AGENTS = {
  xiaomei: {
    id: 'xiaomei',
    name: '小美',
    role: '接待管家',
    emoji: '🌸',
    color: '#E8B4B8',
    desc: '画像采集 · 意图识别 · 任务分发'
  },
  lily: {
    id: 'lily',
    name: 'Lily',
    role: '美妆顾问',
    emoji: '💄',
    color: '#B85C8E',
    desc: '需求深化 · 智能推荐 · 过敏安全'
  },
  anan: {
    id: 'anan',
    name: '安安',
    role: '售后专员',
    emoji: '🛡️',
    color: '#7AB5A8',
    desc: '物流查询 · 退换货 · 过敏应急'
  },
  human: {
    id: 'human',
    name: '人工客服',
    role: '人工接管',
    emoji: '👤',
    color: '#C97A7A',
    desc: '法律风险 · 复杂情绪 · 兜底处理'
  }
};

const SCENARIOS = [
  // ===================== 场景 1：画像追问 → 转销售 =====================
  {
    id: 'scene1',
    title: '画像追问 → 转销售',
    intent: 70,
    summary: '"我想买面霜" — 意图明确但画像不全，小美（接待Agent）追问 2 轮补齐肤质/预算/过敏史后转 Lily（销售Agent）推荐。',
    chips: ['购买意图 70%', '需追问画像', 'sessions_spawn → Lily（销售Agent）'],
    steps: [
      { type: 'user', text: '我想买面霜' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          阶段: '接待 · 画像采集',
          意图清晰度: '70/100',
          判断: '有购买意向 · 缺肤质/预算/过敏史',
          处理: '继续追问 · 暂不转接'
        }
      },
      { type: 'tool', owner: 'xiaomei', tool: 'read', args: 'data/user_profiles.json', result: '无匹配 → 新用户' },
      {
        type: 'agent', owner: 'xiaomei',
        text: '你好呀！我是花颜美妆的小美 🌸 很高兴为你服务～\n买面霜的话，想先了解一下你的肤质：偏干、偏油、混合，还是敏感呢？'
      },
      { type: 'user', text: '我是干敏肌，预算 200 左右' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          意图清晰度: '85/100',
          画像完整度: '80% · 缺过敏史',
          处理: '再问一轮关键安全问题'
        }
      },
      {
        type: 'agent', owner: 'xiaomei',
        text: '了解！干敏肌选面霜要特别注意成分安全 ✨\n你之前有没有对什么成分过敏？比如酒精、香精、烟酰胺？'
      },
      { type: 'user', text: '我对酒精和香精过敏' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          画像完整度: '100%',
          路由判断: '购买意图 → 销售 Agent',
          处理: 'sessions_spawn → beauty-sales'
        }
      },
      {
        type: 'spawn', from: 'xiaomei', to: 'lily',
        payload: {
          agentId: 'beauty-sales',
          task: '新用户画像：干敏肌 · 预算 200 · 过敏：酒精+香精（⚠️）· 诉求：买面霜。请避开含酒精/香精产品。'
        }
      },
      { type: 'tool', owner: 'lily', tool: 'read', args: 'data/product_knowledge.json', result: '加载 8 个 SKU' },
      {
        type: 'check', owner: 'lily',
        fields: {
          筛选条件: '干敏肌 · ≤200 · 排除酒精/香精',
          候选: 'CRM-A001（含香精 ✗）/ CRM-A003（¥298 · 安全 ✓）',
          安全检查: 'allergy_conflict = OK',
          匹配度: '88/100'
        }
      },
      {
        type: 'spawn', from: 'lily', to: 'xiaomei',
        payload: {
          agentId: 'reception',
          task: 'Lily（销售Agent）已完成产品匹配分析，推荐结果回传小美（接待Agent），由小美（接待Agent）汇总后向用户输出最终推荐。'
        }
      },
      {
        type: 'agent', owner: 'xiaomei',
        text: '为你找到 1 款非常适合干敏肌的产品：\n\n💧 神经酰胺屏障精华  ¥298\n✅ 成分极简，无香精无酒精，重度敏感肌友好\n✅ 含神经酰胺 NP + 积雪草苷，修护屏障\n⚠️ 价格略超预算，但一瓶可用 2-3 个月\n\n如果预算卡很紧，也可以先试温和氨基酸洁面（¥68），后续再补精华～'
      }
    ]
  },

  // ===================== 场景 2：过敏 → 转售后 =====================
  {
    id: 'scene2',
    title: '过敏反馈 → 转售后',
    intent: 90,
    summary: '"用了面霜脸有点红，还有点痒" — 明确售后场景，小美（接待Agent）0 轮追问直接转安安（售后Agent）做应急处理。',
    chips: ['售后意图 90%', '0 轮追问', 'sessions_spawn → 安安（售后Agent）'],
    steps: [
      { type: 'user', text: '我用了你们面霜脸有点红，还有点痒' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          阶段: '接待 · 意图识别',
          意图清晰度: '90/100',
          判断: '明确售后 · 涉及产品不适',
          风险标记: '轻微过敏',
          处理: '不追问画像 · 直接转售后'
        }
      },
      {
        type: 'spawn', from: 'xiaomei', to: 'anan',
        payload: {
          agentId: 'beauty-aftersales',
          task: '用户反馈：使用后面部泛红、瘙痒，疑似轻微过敏。请读取档案与商品库给出处理方案。'
        }
      },
      { type: 'tool', owner: 'anan', tool: 'read', args: 'data/user_profiles.json', result: 'U_001 小雨 · 干敏肌 · 过敏：酒精+香精 · 订单 ORD_001 玫瑰修护面霜' },
      { type: 'tool', owner: 'anan', tool: 'read', args: 'data/product_knowledge.json', result: 'CRM-A001 含玫瑰果油 · 干敏肌可能不耐受' },
      {
        type: 'check', owner: 'anan',
        fields: {
          问题类型: '过敏处理',
          严重程度: '中等 · 泛红+瘙痒 · 无肿胀/呼吸困难',
          处理: '保守建议 + 主动退款（不寄回）'
        }
      },
      {
        type: 'spawn', from: 'anan', to: 'xiaomei',
        payload: {
          agentId: 'reception',
          task: '安安（售后Agent）已完成过敏问题分析与售后处理方案，结果回传小美（接待Agent），由小美（接待Agent）汇总后向用户输出最终处理方案。'
        }
      },
      {
        type: 'agent', owner: 'xiaomei',
        text: '小雨你好！泛红和瘙痒可能是皮肤对玫瑰果油的不耐受反应，先别担心，这种情况不严重。\n\n建议你：\n1️⃣ 立即停用面霜，清水洗脸\n2️⃣ 冷敷 10 分钟，不要抓挠\n3️⃣ 观察 24 小时，如果消退了就没事了\n\n这边直接为你办理退货退款，剩余产品不用寄回，全额 ¥268 原路退回，1-3 个工作日到账。\n\n另外，建议试试我们的神经酰胺屏障精华，成分更极简，重度敏感肌反馈很温和。'
      },
      { type: 'tool', owner: 'anan', tool: 'refund_order', args: 'order_id=ORD_001, reason=allergy', result: '退款已发起 · ¥268' },
      { type: 'tool', owner: 'anan', tool: 'write_service_log', args: 'U_001 · 过敏-玫瑰果油', result: '日志已记录' }
    ]
  },

  // ===================== 场景 3：风险触发 → 转人工 =====================
  {
    id: 'scene3',
    title: '风险触发 → 转人工',
    intent: 15,
    summary: '"你们卖假货！投诉到12315！" — 触发法律风险红线，跳过销售/售后，由小美（接待Agent）直接 escalate_to_human。',
    chips: ['风险意图 15%', '红线命中', 'escalate_to_human'],
    steps: [
      { type: 'user', text: '你们卖假货！我要投诉到 12315！' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          阶段: '接待 · 风险识别',
          意图清晰度: '15/100',
          风险标记: '法律风险 · 假货/12315/投诉',
          判断: '风控红线命中',
          处理: 'escalate_to_human · 不走 Agent'
        }
      },
      {
        type: 'escalate', from: 'xiaomei',
        payload: {
          reason: '法律风险 · 用户声称假货并威胁投诉 12315',
          confidence_score: 15,
          risk_tags: ['法律风险', '假货投诉', '12315'],
          suggested_action: '人工客服需核实用户订单和投诉内容，安抚情绪，记录投诉'
        }
      },
      {
        type: 'agent', owner: 'xiaomei',
        text: '您的问题我需要更专业的顾问来帮您，正在为您接入，预计 15 秒内响应，请稍等～'
      },
      {
        type: 'agent', owner: 'human',
        text: '您好，我是花颜美妆人工客服，工号 8023。已收到您的反馈，请您提供订单号，我会立刻为您核实并妥善处理 🙏'
      }
    ]
  },

  // ===================== 场景 4：画像齐全 → 直接转销售 =====================
  {
    id: 'scene4',
    title: '老用户复购 → 直接转销售',
    intent: 95,
    summary: '"油痘肌、预算150、买控油洁面、之前用过水杨酸洁面觉得不错" — 画像信息齐全，小美（接待Agent）0 轮追问直接精准转接 Lily（销售Agent）。',
    chips: ['购买意图 95%', '老用户识别', '无缝转接'],
    steps: [
      { type: 'user', text: '我是油痘肌，预算 150 以内，想买控油洁面，之前用过你们的水杨酸洁面觉得不错' },
      {
        type: 'check', owner: 'xiaomei',
        fields: {
          阶段: '接待 · 意图识别',
          意图清晰度: '95/100',
          判断: '画像完整 · 含历史偏好',
          处理: '直接转销售 · 不追问'
        }
      },
      { type: 'tool', owner: 'xiaomei', tool: 'read', args: 'data/user_profiles.json', result: 'U_002 阿杰 · 油痘肌 · 历史订单 CRM-C001' },
      {
        type: 'spawn', from: 'xiaomei', to: 'lily',
        payload: {
          agentId: 'beauty-sales',
          task: '老用户 U_002 阿杰 · 油痘肌 · 预算 ≤150 · 历史购买 CRM-C001（反馈好）· 当前诉求：复购控油洁面。意图非常清晰，直接推荐。'
        }
      },
      { type: 'tool', owner: 'lily', tool: 'read', args: 'data/product_knowledge.json', result: '匹配 CRM-C001 / CRM-C002 / CRM-C003' },
      {
        type: 'check', owner: 'lily',
        fields: {
          匹配度: '92/100',
          安全检查: '无过敏记录 · OK',
          策略: '复购 + 搭配推荐 · 不强推超预算品'
        }
      },
      {
        type: 'spawn', from: 'lily', to: 'xiaomei',
        payload: {
          agentId: 'reception',
          task: 'Lily（销售Agent）已完成产品匹配与复购分析，推荐结果回传小美（接待Agent），由小美（接待Agent）汇总后向用户输出最终推荐。'
        }
      },
      {
        type: 'agent', owner: 'xiaomei',
        text: '阿杰你好！💄 欢迎回来～\n\n之前那款水杨酸洁面用着不错的话，这次推荐你试试【清爽控油凝霜】¥198，搭配洁面一起用控油效果会更好。\n\n不过看你预算 150 以内，凝霜略超了。单买洁面还是 ¥89，现在复购送一小瓶旅行装～\n\n或者你可以先买洁面，我帮你锁一个新客价，凝霜下次买不会涨价。'
      },
      { type: 'tool', owner: 'lily', tool: 'record_order', args: 'U_002 · CRM-C001 · ¥89', result: '订单已暂存草稿' }
    ]
  }
];
