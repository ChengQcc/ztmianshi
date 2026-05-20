// =============================================================
// HuaYan · Multi-Agent Demo · Controller
// SPA routing, scenario playback, streaming chat, flow orchestration
// =============================================================

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 头像缩写：极简风格用单字而非 emoji
  const AVATARS = {
    user:    '客',
    xiaomei: '美',
    lily:    'L',
    anan:    '安',
    human:   '人'
  };
  const AGENT_TAGS = {
    xiaomei: 'A-01 · 接待',
    lily:    'A-02 · 销售',
    anan:    'A-03 · 售后',
    human:   '人工兜底'
  };

  // 统一显示名：小美（接待Agent）/ Lily（销售Agent）/ 安安（售后Agent）
  function agentDisplayName(key) {
    const agent = AGENTS[key];
    if (!agent) return key;
    const tag = AGENT_TAGS[key];
    if (tag && tag.includes(' · ')) {
      return agent.name + '（' + tag.split(' · ')[1] + 'Agent）';
    }
    return agent.name;
  }

  const state = {
    currentScene: 'scene1',
    currentAgent: 'xiaomei',
    speed: 2,
    playing: false,
    abortPlayback: false,
    sessionId: 0,
    logCount: 0
  };

  // ---------------- Routing ----------------
  function parseHash() {
    const h = (location.hash || '#home').slice(1);
    if (h === 'home' || h === 'about' || h === 'agents') {
      return { page: 'home', anchor: h };
    }
    if (h.startsWith('scene')) return { page: 'demo', scene: h };
    if (['xiaomei','lily','anan'].includes(h)) {
      const map = { xiaomei: 'scene1', lily: 'scene1', anan: 'scene2' };
      return { page: 'demo', scene: map[h] };
    }
    return { page: 'home', anchor: 'home' };
  }

  function applyRoute() {
    const r = parseHash();
    if (r.page === 'home') {
      $('#page-home').classList.add('active');
      $('#page-demo').classList.remove('active');
      if (r.anchor && r.anchor !== 'home') {
        const t = document.getElementById(r.anchor);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      $('#page-home').classList.remove('active');
      $('#page-demo').classList.add('active');
      window.scrollTo(0, 0);
      switchScene(r.scene || 'scene1', { autoplay: false });
    }
  }
  window.addEventListener('hashchange', applyRoute);

  // ---------------- Home: card click ----------------
  $$('.agent-card').forEach(card => {
    card.addEventListener('click', () => {
      location.hash = '#' + card.dataset.agent;
    });
  });

  // ---------------- Scene tabs ----------------
  function buildSceneTabs() {
    const tabs = $('#scene-tabs');
    tabs.innerHTML = '';
    SCENARIOS.forEach((s, idx) => {
      const el = document.createElement('div');
      el.className = 'scene-tab' + (s.id === state.currentScene ? ' active' : '');
      el.textContent = `0${idx + 1} · ${s.title}`;
      el.dataset.scene = s.id;
      el.onclick = () => {
        if (state.playing) state.abortPlayback = true;
        location.hash = '#' + s.id;
      };
      tabs.appendChild(el);
    });
  }

  function getScene(id) {
    return SCENARIOS.find(s => s.id === id);
  }

  function switchScene(sceneId, opts = {}) {
    state.currentScene = sceneId;
    state.abortPlayback = true;
    state.sessionId += 1;
    const scene = getScene(sceneId);
    if (!scene) return;

    const firstAgentStep = scene.steps.find(s => s.owner);
    state.currentAgent = firstAgentStep ? firstAgentStep.owner : 'xiaomei';

    buildSceneTabs();

    const tag = AGENT_TAGS[state.currentAgent] || AGENT_TAGS.xiaomei;
    const [id, role] = tag.split(' · ');
    $('#demo-agent-id').textContent = id;
    $('#demo-agent-name').textContent = (AGENTS[state.currentAgent] || AGENTS.xiaomei).name;
    $('#demo-agent-role').textContent = '/ ' + (role || '接待') + 'Agent';

    $('#scene-meta-title').textContent = scene.title;
    $('#scene-meta-summary').textContent = scene.summary;
    const chips = $('#scene-meta-chips');
    chips.innerHTML = '';
    scene.chips.forEach(c => {
      const e = document.createElement('span');
      e.className = 'chip';
      e.textContent = c;
      chips.appendChild(e);
    });

    resetChat();
    resetFlow();

    if (opts.autoplay) {
      setTimeout(() => playScene(), 300);
    }
  }

  function resetChat() {
    const win = $('#chat-window');
    win.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-glyph">◇</div>
        <div>点击 <kbd>播放</kbd> 开始演示</div>
      </div>`;
    setStatus('就绪', false);
  }

  function resetFlow() {
    $$('.flow-node').forEach(n => n.classList.remove('active', 'fired', 'risk'));
    $$('.flow-edge').forEach(e => e.classList.remove('active', 'fired', 'active-cyan'));
    $('#flow-log-list').innerHTML = '<div class="flow-log-empty">等待事件…</div>';
    state.logCount = 0;
    $('#flow-log-count').textContent = '0';
  }

  function setStatus(text, running) {
    const s = $('#demo-status');
    s.querySelector('.status-text').textContent = text;
    s.classList.toggle('running', !!running);
  }

  // ---------------- Chat rendering ----------------
  function appendBubble({ role, name, text, agentClass }) {
    const win = $('#chat-window');
    if (win.querySelector('.chat-empty')) win.innerHTML = '';
    const bubble = document.createElement('div');
    const cls = role === 'user' ? 'bubble-user' : ('bubble-' + (agentClass || ''));
    bubble.className = 'bubble ' + cls;
    const av = AVATARS[role === 'user' ? 'user' : agentClass] || '·';
    bubble.innerHTML = `
      <div class="bubble-avatar">${av}</div>
      <div class="bubble-content">
        <div class="bubble-name">${name}</div>
        <div class="bubble-text"></div>
      </div>
    `;
    win.appendChild(bubble);
    const textNode = bubble.querySelector('.bubble-text');
    win.scrollTop = win.scrollHeight;
    return textNode;
  }

  async function streamText(node, text, charDelay = 16) {
    for (let i = 0; i < text.length; i++) {
      if (state.abortPlayback) return;
      node.textContent += text[i];
      $('#chat-window').scrollTop = $('#chat-window').scrollHeight;
      await sleep(charDelay / state.speed);
    }
  }

  function appendMeta(kind, headText, fields) {
    const win = $('#chat-window');
    if (win.querySelector('.chat-empty')) win.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'bubble-meta ' + (kind || '');
    let icon = '◆';
    if (kind === 'spawn') icon = '⇢';
    else if (kind === 'escalate') icon = '⚠';
    else if (kind === 'tool') icon = '⚙';
    let rowsHtml = '';
    Object.keys(fields).forEach(k => {
      rowsHtml += `<div class="meta-row"><b>${k}</b><span>${fields[k]}</span></div>`;
    });
    card.innerHTML = `
      <div class="bubble-meta-head"><span class="tag-icon">${icon}</span>${headText}</div>
      ${rowsHtml}
    `;
    win.appendChild(card);
    win.scrollTop = win.scrollHeight;
  }

  // ---------------- Flow operations ----------------
  function pulseNode(nodeId) {
    $$('.flow-node').forEach(n => {
      if (n.classList.contains('active')) n.classList.replace('active', 'fired');
    });
    const n = document.querySelector(`[data-node="${nodeId}"]`);
    if (n) n.classList.add('active');
  }
  function markRisk(nodeId) {
    const n = document.querySelector(`[data-node="${nodeId}"]`);
    if (n) n.classList.add('risk');
  }
  function pulseEdge(edgeId, options = {}) {
    const e = document.querySelector(`[data-edge="${edgeId}"]`);
    if (!e) return;
    if (options.cyan) e.classList.add('active-cyan');
    e.classList.add('active');
    if (options.persist !== false) {
      setTimeout(() => {
        e.classList.remove('active', 'active-cyan');
        e.classList.add('fired');
      }, options.duration || 1400);
    }
  }

  function logTool({ kind, owner, tool, args, result }) {
    const list = $('#flow-log-list');
    const empty = list.querySelector('.flow-log-empty');
    if (empty) empty.remove();
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const item = document.createElement('div');
    item.className = 'log-item ' + (kind ? 'tool-' + kind : '');
    const ownerName = agentDisplayName(owner);
    item.innerHTML = `
      <div><span class="log-time">${time}</span> · ${ownerName} · <span class="log-tool">${tool}</span></div>
      ${args ? `<div class="log-args">${args}</div>` : ''}
      ${result ? `<div class="log-result">→ ${result}</div>` : ''}
    `;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
    state.logCount += 1;
    $('#flow-log-count').textContent = String(state.logCount);
  }

  // ---------------- Return-flow animation ----------------
  // 子 agent 回复后，触发一次反向流光：sub → 小美 → 用户
  // 用动画体现"小美汇总后输出"的语义
  async function animateReturnFlow(fromAgent) {
    const subEdgeMap = {
      lily: 'xiaomei-lily',
      anan: 'xiaomei-anan'
    };
    const edgeId = subEdgeMap[fromAgent];
    if (!edgeId) return;
    // 先点亮子 agent 节点
    pulseNode(fromAgent);
    await sleep(120 / state.speed);
    // 子 → 小美
    const e = document.querySelector(`[data-edge="${edgeId}"]`);
    if (e) {
      e.classList.add('active', 'active-cyan');
      setTimeout(() => {
        e.classList.remove('active', 'active-cyan');
        e.classList.add('fired');
      }, 1100);
    }
    await sleep(420 / state.speed);
    // 小美短暂亮起作为汇总点
    pulseNode('xiaomei');
    await sleep(180 / state.speed);
    // 小美 → 用户
    const ue = document.querySelector('[data-edge="user-xiaomei"]');
    if (ue) {
      ue.classList.add('active', 'active-cyan');
      setTimeout(() => {
        ue.classList.remove('active', 'active-cyan');
        ue.classList.add('fired');
      }, 900);
    }
    await sleep(220 / state.speed);
    pulseNode('user');
    await sleep(120 / state.speed);
  }

  // ---------------- Step dispatcher ----------------
  async function executeStep(step) {
    const baseDelay = 480 / state.speed;

    if (step.type === 'user') {
      pulseNode('user');
      pulseEdge('user-xiaomei');
      const node = appendBubble({
        role: 'user',
        name: '用户',
        agentClass: 'user'
      });
      await streamText(node, step.text, 24);
      await sleep(baseDelay);
      return;
    }

    if (step.type === 'check') {
      pulseNode(step.owner);
      appendMeta('check', `${agentDisplayName(step.owner)} · confidence_check`, step.fields);
      logTool({ kind: 'tool', owner: step.owner, tool: 'confidence_check', args: '置信度自检', result: Object.values(step.fields).pop() });
      await sleep(baseDelay * 1.4);
      return;
    }

    if (step.type === 'tool') {
      // data 工具：联动 data 节点
      if (step.tool === 'read') {
        pulseNode(step.owner);
        await sleep(150 / state.speed);
        if (step.owner === 'xiaomei') {
          pulseEdge('xiaomei-data', { cyan: true });
        } else if (step.owner === 'lily') {
          pulseEdge('data-lily', { cyan: true });
        } else if (step.owner === 'anan') {
          pulseEdge('data-anan', { cyan: true });
        }
        pulseNode('data');
        await sleep(280 / state.speed);
        pulseNode(step.owner);
      } else {
        pulseNode(step.owner);
      }
      appendMeta('tool', `${agentDisplayName(step.owner)} · ${step.tool}`, {
        参数: step.args,
        结果: step.result || '已执行'
      });
      logTool({ kind: 'tool', owner: step.owner, tool: step.tool, args: step.args, result: step.result });
      await sleep(baseDelay);
      return;
    }

    if (step.type === 'agent') {
      pulseNode(step.owner);
      const a = AGENTS[step.owner];
      const node = appendBubble({
        role: 'agent',
        name: agentDisplayName(step.owner),
        agentClass: step.owner
      });
      await sleep(280 / state.speed);
      await streamText(node, step.text, 18);

      // 关键：子 agent 回复结束后触发回流动画
      if (step.owner === 'lily' || step.owner === 'anan') {
        await sleep(360 / state.speed);
        await animateReturnFlow(step.owner);
      }
      await sleep(baseDelay);
      return;
    }

    if (step.type === 'spawn') {
      pulseNode(step.from);
      const targetEdge = (step.from === 'lily' || step.to === 'lily') ? 'xiaomei-lily' : 'xiaomei-anan';
      pulseEdge(targetEdge);
      const fromName = agentDisplayName(step.from);
      const toName = agentDisplayName(step.to);
      appendMeta('spawn', `sessions_spawn  ·  ${fromName} → ${toName}`, {
        子智能体: step.payload.agentId,
        交接任务: step.payload.task
      });
      logTool({ kind: 'spawn', owner: step.from, tool: 'sessions_spawn', args: step.payload.agentId, result: `${toName} 已接管` });
      await sleep(700 / state.speed);
      pulseNode(step.to);
      // 逆向 spawn（子 agent → 小美）时触发回流动画
      if (step.to === 'xiaomei') {
        await sleep(360 / state.speed);
        await animateReturnFlow(step.from);
      }
      await sleep(baseDelay);
      return;
    }

    if (step.type === 'escalate') {
      pulseEdge('xiaomei-human');
      markRisk('xiaomei');
      const fields = {
        升级原因: step.payload.reason,
        置信度评分: step.payload.confidence_score,
        风险标签: step.payload.risk_tags.join(' / '),
        建议动作: step.payload.suggested_action
      };
      appendMeta('escalate', 'escalate_to_human  ·  红线触发', fields);
      logTool({ kind: 'escalate', owner: step.from, tool: 'escalate_to_human', args: step.payload.reason, result: '人工客服已介入' });
      await sleep(700 / state.speed);
      pulseNode('human');
      markRisk('human');
      await sleep(baseDelay);
      return;
    }
  }

  // ---------------- Playback ----------------
  async function playScene() {
    if (state.playing) return;
    const scene = getScene(state.currentScene);
    if (!scene) return;
    resetChat();
    resetFlow();
    state.playing = true;
    state.abortPlayback = false;
    state.sessionId += 1;
    const mySession = state.sessionId;
    setStatus('演示中', true);
    $('#btn-play').disabled = true;
    $('#btn-play').innerHTML = '<span class="play-icon">▶</span> 播放中';

    try {
      for (const step of scene.steps) {
        if (state.abortPlayback || state.sessionId !== mySession) return;
        await executeStep(step);
      }
      setStatus('已完成', false);
    } finally {
      state.playing = false;
      $('#btn-play').disabled = false;
      $('#btn-play').innerHTML = '<span class="play-icon">▶</span> 播放';
    }
  }

  $('#btn-play').onclick = () => playScene();
  $('#btn-restart').onclick = () => {
    state.abortPlayback = true;
    setTimeout(() => playScene(), 200);
  };
  $('#speed-select').onchange = (e) => {
    state.speed = Number(e.target.value);
  };

  // ---------------- Boot ----------------
  document.addEventListener('DOMContentLoaded', applyRoute);
  applyRoute();

})();
