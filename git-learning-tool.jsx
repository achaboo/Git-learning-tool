import { useState, useEffect, useRef } from "react";

// ============================================================
// TYPES & INITIAL STATE
// ============================================================
const LESSONS = [
  {
    id: 1,
    title: "リポジトリの初期化",
    description: "新しいGitリポジトリを作成しましょう。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: "git init",
    hint: "git init を入力してEnterキーを押す",
    expectedAction: "init",
    explanation: "git init はフォルダをGitリポジトリに変換します。隠しフォルダ .git が作成され、ここに全履歴が保存されます。",
  },
  {
    id: 2,
    title: "ファイルをステージングに追加",
    description: "変更したファイルをステージングエリアに追加します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: "git add README.md",
    hint: "git add ファイル名 でファイルを指定します",
    expectedAction: "add",
    explanation: "git add はファイルをワークツリーからステージング（待合室）に移します。コミットするファイルを選択する操作です。",
  },
  {
    id: 3,
    title: "コミット（セーブ）",
    description: "ステージングのファイルをリポジトリに記録します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: 'git commit -m "初回コミット"',
    hint: '-m "メッセージ" でコミットメッセージを指定',
    expectedAction: "commit",
    explanation: "git commit でステージングの内容を永続的に記録します。メッセージは「何をしたか」を説明するメモです。",
  },
  {
    id: 4,
    title: "ブランチの作成",
    description: "mainから新しいブランチ「feature」を作成します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: "git checkout -b feature",
    hint: "-b オプションで新規ブランチ作成と切り替えを同時に行います",
    expectedAction: "branch",
    explanation: "ブランチは「作業スペースの分岐」です。mainを汚さずに安全に実験できます。checkout -b で作成＆移動を同時に行います。",
  },
  {
    id: 5,
    title: "featureブランチでコミット",
    description: "featureブランチで変更を記録します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: 'git commit -m "featureブランチの変更"',
    hint: "featureブランチにいる状態でコミットします",
    expectedAction: "commit_feature",
    explanation: "ブランチ上でのコミットはmainに影響しません。安全に作業を進められます。",
  },
  {
    id: 6,
    title: "mainへのマージ",
    description: "featureブランチをmainに合流させます。",
    instruction: "まずmainに戻り、マージします：",
    command: "git checkout main\ngit merge feature",
    hint: "先にmainに切り替えてからmergeを実行",
    expectedAction: "merge",
    explanation: "merge はブランチを合流させます。featureの変更がmainに取り込まれ、ブランチ統合が完了します。",
  },
];

const initialGitState = {
  initialized: false,
  currentBranch: null,
  branches: {},
  stagingArea: [],
  workTree: ["README.md", "index.js", "style.css"],
  log: [],
};

// ============================================================
// HELPERS
// ============================================================
function parseCommand(input, gitState) {
  const cmd = input.trim().toLowerCase();
  let newState = { ...gitState };
  let result = { success: false, message: "", action: null };

  if (cmd === "git init") {
    if (gitState.initialized) {
      result.message = "⚠️ すでに初期化済みです";
      return { newState, result };
    }
    newState.initialized = true;
    newState.currentBranch = "main";
    newState.branches = { main: [] };
    result.success = true;
    result.message = "✅ Initialized empty Git repository";
    result.action = "init";
  } else if (cmd.startsWith("git add ")) {
    if (!gitState.initialized) {
      result.message = "❌ 先にgit initを実行してください";
      return { newState, result };
    }
    const file = input.trim().slice(8).trim();
    if (!gitState.workTree.includes(file) && file !== "." && file !== "-A") {
      result.message = `❌ ファイル "${file}" が見つかりません`;
      return { newState, result };
    }
    const toAdd = (file === "." || file === "-A") ? [...gitState.workTree] : [file];
    const already = toAdd.filter(f => gitState.stagingArea.includes(f));
    const newFiles = toAdd.filter(f => !gitState.stagingArea.includes(f));
    newState.stagingArea = [...gitState.stagingArea, ...newFiles];
    result.success = true;
    result.message = `✅ ${newFiles.join(", ")} をステージングに追加しました`;
    result.action = "add";
  } else if (cmd.startsWith('git commit -m "') || cmd.startsWith("git commit -m '")) {
    if (!gitState.initialized) {
      result.message = "❌ 先にgit initを実行してください";
      return { newState, result };
    }
    if (gitState.stagingArea.length === 0) {
      result.message = "❌ ステージングが空です。git addを先に実行してください";
      return { newState, result };
    }
    const msgMatch = input.match(/git commit -m ["'](.+)["']/i);
    const msg = msgMatch ? msgMatch[1] : "コミット";
    const commit = {
      id: Math.random().toString(36).slice(2, 8),
      message: msg,
      branch: gitState.currentBranch,
      files: [...gitState.stagingArea],
      time: new Date().toLocaleTimeString("ja-JP"),
    };
    const branch = gitState.currentBranch;
    newState.branches = {
      ...gitState.branches,
      [branch]: [...(gitState.branches[branch] || []), commit],
    };
    newState.stagingArea = [];
    newState.log = [...gitState.log, commit];
    result.success = true;
    result.message = `✅ [${branch}] "${msg}" (${commit.id})`;
    result.action = gitState.currentBranch === "main" ? "commit" : "commit_feature";
  } else if (cmd === "git checkout -b feature") {
    if (!gitState.initialized || !gitState.branches.main) {
      result.message = "❌ 先にmainブランチでコミットしてください";
      return { newState, result };
    }
    if (gitState.branches.feature) {
      result.message = "⚠️ featureブランチはすでに存在します";
      return { newState, result };
    }
    newState.branches = { ...gitState.branches, feature: [] };
    newState.currentBranch = "feature";
    result.success = true;
    result.message = "✅ Switched to a new branch 'feature'";
    result.action = "branch";
  } else if (cmd === "git checkout main") {
    newState.currentBranch = "main";
    result.success = true;
    result.message = "✅ Switched to branch 'main'";
    result.action = "checkout_main";
  } else if (cmd === "git merge feature") {
    if (gitState.currentBranch !== "main") {
      result.message = "❌ mainブランチにいる状態でマージしてください";
      return { newState, result };
    }
    if (!gitState.branches.feature || gitState.branches.feature.length === 0) {
      result.message = "❌ featureブランチにコミットがありません";
      return { newState, result };
    }
    const featureCommits = gitState.branches.feature;
    newState.branches = {
      ...gitState.branches,
      main: [...(gitState.branches.main || []), ...featureCommits],
    };
    result.success = true;
    result.message = "✅ Merged branch 'feature' into main";
    result.action = "merge";
  } else {
    result.message = `❓ 不明なコマンド: "${input.trim()}"`;
  }

  return { newState, result };
}

// ============================================================
// SVG FLOW DIAGRAM
// ============================================================
function FlowDiagram({ gitState }) {
  const { initialized, branches, currentBranch, stagingArea, workTree } = gitState;

  const mainCommits = branches.main || [];
  const featureCommits = branches.feature || [];
  const hasMerge = mainCommits.some(c => featureCommits.includes(c));
  const hasFeature = !!branches.feature;

  return (
    <svg viewBox="0 0 820 220" width="100%" style={{ maxHeight: 220, overflow: "visible" }}>
      {/* Background */}
      <rect x="0" y="0" width="820" height="220" rx="12" fill="#0d1117" />

      {/* ===== WORK AREA SECTION ===== */}
      {/* ワークツリー */}
      <rect x="10" y="60" width="140" height="110" rx="8" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
      <text x="80" y="82" textAnchor="middle" fill="#8b949e" fontSize="11" fontFamily="monospace">ワークツリー</text>
      {workTree.map((f, i) => (
        <g key={f}>
          <rect x="18" y={90 + i * 22} width="124" height="18" rx="4" fill="#21262d" />
          <text x="80" y={103 + i * 22} textAnchor="middle" fill="#58a6ff" fontSize="10" fontFamily="monospace">{f}</text>
        </g>
      ))}

      {/* 矢印: WorkTree → Staging */}
      <line x1="150" y1="115" x2="180" y2="115" stroke={stagingArea.length > 0 ? "#3fb950" : "#30363d"} strokeWidth="2" markerEnd="url(#arr)" />
      <text x="165" y="110" textAnchor="middle" fill={stagingArea.length > 0 ? "#3fb950" : "#484f58"} fontSize="9" fontFamily="monospace">add</text>

      {/* ステージング */}
      <rect x="180" y="60" width="140" height="110" rx="8"
        fill="#161b22"
        stroke={stagingArea.length > 0 ? "#3fb950" : "#30363d"}
        strokeWidth={stagingArea.length > 0 ? 2 : 1.5}
      />
      <text x="250" y="82" textAnchor="middle" fill="#8b949e" fontSize="11" fontFamily="monospace">ステージング</text>
      {stagingArea.length === 0
        ? <text x="250" y="120" textAnchor="middle" fill="#484f58" fontSize="10" fontFamily="monospace">（空）</text>
        : stagingArea.map((f, i) => (
          <g key={f}>
            <rect x="188" y={90 + i * 22} width="124" height="18" rx="4" fill="#1a2a1a" />
            <text x="250" y={103 + i * 22} textAnchor="middle" fill="#3fb950" fontSize="10" fontFamily="monospace">{f}</text>
          </g>
        ))
      }

      {/* 矢印: Staging → Repo */}
      <line x1="320" y1="115" x2="350" y2="115" stroke={initialized ? "#f0883e" : "#30363d"} strokeWidth="2" markerEnd="url(#arr2)" />
      <text x="335" y="110" textAnchor="middle" fill={initialized ? "#f0883e" : "#484f58"} fontSize="9" fontFamily="monospace">commit</text>

      {/* ===== REPOSITORY SECTION ===== */}
      <rect x="350" y="10" width="460" height="200" rx="10" fill="#0d1117" stroke="#30363d" strokeWidth="1" strokeDasharray="4 2" />
      <text x="580" y="28" textAnchor="middle" fill="#8b949e" fontSize="11" fontFamily="monospace">リポジトリ（.git）</text>

      {/* mainブランチのライン */}
      <text x="370" y="70" fill="#58a6ff" fontSize="11" fontFamily="monospace" fontWeight="bold">main</text>
      {!initialized && (
        <text x="500" y="88" textAnchor="middle" fill="#484f58" fontSize="10" fontFamily="monospace">（未初期化）</text>
      )}

      {/* mainのコミットノード */}
      {mainCommits.map((c, i) => {
        const x = 400 + i * 80;
        const y = 90;
        const isMergeCommit = featureCommits.includes(c);
        return (
          <g key={c.id}>
            {i > 0 && <line x1={x - 66} y1={y} x2={x - 14} y2={y} stroke="#58a6ff" strokeWidth="2" />}
            <circle cx={x} cy={y} r={isMergeCommit ? 14 : 11}
              fill={isMergeCommit ? "#8957e5" : "#1f6feb"}
              stroke={currentBranch === "main" && i === mainCommits.length - 1 ? "#ffa657" : "#388bfd"}
              strokeWidth={currentBranch === "main" && i === mainCommits.length - 1 ? 3 : 1.5}
            />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace">{c.id}</text>
            <text x={x} y={y + 24} textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace"
              style={{ maxWidth: 70 }}>{c.message.slice(0, 8)}</text>
            {/* ファイルバッジ */}
            {c.files.map((f, fi) => (
              <g key={fi}>
                <rect x={x - 26} y={y - 34 - fi * 14} width="52" height="12" rx="3" fill="#21262d" />
                <text x={x} y={y - 24 - fi * 14} textAnchor="middle" fill="#79c0ff" fontSize="8" fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>
        );
      })}

      {/* HEADポインタ（main） */}
      {initialized && mainCommits.length > 0 && currentBranch === "main" && (
        <>
          <rect x={400 + (mainCommits.length - 1) * 80 - 18} y={108} width="36" height="13" rx="3" fill="#ffa657" opacity="0.9" />
          <text x={400 + (mainCommits.length - 1) * 80} y={118} textAnchor="middle" fill="#0d1117" fontSize="8.5" fontWeight="bold" fontFamily="monospace">HEAD</text>
        </>
      )}

      {/* featureブランチ */}
      {hasFeature && (
        <>
          <text x="370" y="150" fill="#a5d6ff" fontSize="11" fontFamily="monospace" fontWeight="bold">feature</text>
          {/* 分岐ライン */}
          {mainCommits.length > 0 && (
            <line
              x1={400 + (mainCommits.length - 1) * 80}
              y1={100}
              x2={400 + mainCommits.length * 80}
              y2={162}
              stroke="#3fb950"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}
          {featureCommits.map((c, i) => {
            const x = 400 + (mainCommits.length + i) * 80;
            const y = 170;
            return (
              <g key={c.id}>
                {i > 0 && <line x1={x - 66} y1={y} x2={x - 14} y2={y} stroke="#3fb950" strokeWidth="2" />}
                <circle cx={x} cy={y} r={11}
                  fill="#1a4a2a"
                  stroke={currentBranch === "feature" ? "#ffa657" : "#3fb950"}
                  strokeWidth={currentBranch === "feature" ? 3 : 1.5}
                />
                <text x={x} y={y + 4} textAnchor="middle" fill="#3fb950" fontSize="8" fontFamily="monospace">{c.id}</text>
                <text x={x} y={y + 22} textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace">{c.message.slice(0, 8)}</text>
              </g>
            );
          })}
          {/* HEADポインタ（feature） */}
          {featureCommits.length > 0 && currentBranch === "feature" && (
            <>
              <rect x={400 + (mainCommits.length + featureCommits.length - 1) * 80 - 18} y={183} width="36" height="13" rx="3" fill="#ffa657" opacity="0.9" />
              <text x={400 + (mainCommits.length + featureCommits.length - 1) * 80} y={193} textAnchor="middle" fill="#0d1117" fontSize="8.5" fontWeight="bold" fontFamily="monospace">HEAD</text>
            </>
          )}
        </>
      )}

      {/* 矢印マーカー */}
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#3fb950" />
        </marker>
        <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#f0883e" />
        </marker>
      </defs>
    </svg>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function GitLearningTool() {
  const [gitState, setGitState] = useState(initialGitState);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [terminalLines, setTerminalLines] = useState([
    { type: "system", text: "🎓 Git学習ターミナル（シミュレーター）" },
    { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "system", text: "⚡ コマンドを入力してEnterを押してください" },
  ]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [multiStep, setMultiStep] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const lesson = LESSONS[currentLesson];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  function addTerminalLine(type, text) {
    setTerminalLines(prev => [...prev, { type, text }]);
  }

  function handleSubmit() {
    const input = inputValue.trim();
    if (!input) return;

    addTerminalLine("input", `$ ${input}`);
    setInputValue("");
    setShowHint(false);

    const { newState, result } = parseCommand(input, gitState);

    if (result.message) {
      addTerminalLine(result.success ? "success" : "error", result.message);
    }

    if (result.success) {
      setGitState(newState);

      // レッスン完了チェック
      if (result.action === lesson.expectedAction && !completedLessons.includes(lesson.id)) {
        setCompletedLessons(prev => [...prev, lesson.id]);
        setFeedback({ type: "success", message: lesson.explanation });

        // 次レッスンへの自動進行
        if (currentLesson < LESSONS.length - 1) {
          setTimeout(() => {
            setCurrentLesson(prev => prev + 1);
            setFeedback(null);
          }, 3000);
        }
      }
    } else {
      setFeedback({ type: "error", message: result.message });
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const progress = (completedLessons.length / LESSONS.length) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#010409",
      color: "#e6edf3",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
        borderBottom: "1px solid #21262d",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <span style={{ fontSize: 16, fontWeight: "bold", color: "#58a6ff", letterSpacing: 1 }}>Git Visual Trainer</span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#8b949e", fontSize: 12 }}>進捗</span>
          <div style={{ width: 120, height: 6, background: "#21262d", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #238636, #3fb950)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <span style={{ color: "#3fb950", fontSize: 12 }}>{completedLessons.length}/{LESSONS.length}</span>
        </div>
        {/* Branch indicator */}
        {gitState.currentBranch && (
          <div style={{
            background: "#21262d",
            border: "1px solid #30363d",
            borderRadius: 20,
            padding: "3px 12px",
            fontSize: 12,
            color: gitState.currentBranch === "main" ? "#58a6ff" : "#3fb950",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>⎇</span>
            <span>{gitState.currentBranch}</span>
          </div>
        )}
      </div>

      {/* ===== FLOW DIAGRAM (TOP, LARGE) ===== */}
      <div style={{
        background: "#0d1117",
        borderBottom: "1px solid #21262d",
        padding: "12px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#8b949e", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
            📊 Git フロー可視化
          </span>
          <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#484f58" }}>
            <span>🔵 mainコミット</span>
            <span>🟢 featureコミット</span>
            <span>🟠 HEAD（現在位置）</span>
            <span>🟣 マージコミット</span>
          </div>
        </div>
        <FlowDiagram gitState={gitState} />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ display: "flex", flex: 1, gap: 0, overflow: "hidden" }}>

        {/* ===== LEFT: LESSON PANEL ===== */}
        <div style={{
          width: 280,
          background: "#0d1117",
          borderRight: "1px solid #21262d",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Lesson list */}
          <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #21262d" }}>
            <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>📚 レッスン</div>
            {LESSONS.map((l, i) => {
              const done = completedLessons.includes(l.id);
              const active = i === currentLesson;
              return (
                <div key={l.id}
                  onClick={() => setCurrentLesson(i)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    marginBottom: 2,
                    cursor: "pointer",
                    background: active ? "#1f6feb22" : "transparent",
                    border: `1px solid ${active ? "#1f6feb" : "transparent"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 14 }}>{done ? "✅" : active ? "▶️" : "⬜"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: active ? "#58a6ff" : done ? "#3fb950" : "#8b949e", fontWeight: active ? "bold" : "normal" }}>
                      {l.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Git State Summary */}
          <div style={{ padding: "12px 14px", flex: 1 }}>
            <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>🗂 状態</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#484f58", fontSize: 10, marginBottom: 4 }}>ステージング</div>
              {gitState.stagingArea.length === 0
                ? <div style={{ color: "#484f58", fontSize: 11, fontStyle: "italic" }}>空</div>
                : gitState.stagingArea.map(f => (
                  <div key={f} style={{ background: "#1a2a1a", border: "1px solid #3fb950", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#3fb950", marginBottom: 3 }}>{f}</div>
                ))
              }
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#484f58", fontSize: 10, marginBottom: 4 }}>コミット履歴</div>
              {gitState.log.length === 0
                ? <div style={{ color: "#484f58", fontSize: 11, fontStyle: "italic" }}>なし</div>
                : [...gitState.log].reverse().slice(0, 5).map(c => (
                  <div key={c.id} style={{ marginBottom: 4, borderLeft: `2px solid ${c.branch === "main" ? "#1f6feb" : "#3fb950"}`, paddingLeft: 8 }}>
                    <div style={{ fontSize: 10, color: "#8b949e" }}>{c.id} <span style={{ color: c.branch === "main" ? "#58a6ff" : "#3fb950" }}>[{c.branch}]</span></div>
                    <div style={{ fontSize: 10, color: "#e6edf3" }}>{c.message}</div>
                    <div style={{ fontSize: 9, color: "#484f58" }}>{c.files.join(", ")}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* ===== CENTER: TEACHER + TERMINAL ===== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Teacher instruction */}
          <div style={{
            background: "linear-gradient(135deg, #0d1f0d 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
            padding: "14px 20px",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#3fb950", fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
                  レッスン {lesson.id}/{LESSONS.length}: {lesson.title}
                </div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 8 }}>{lesson.description}</div>
                <div style={{ color: "#e6edf3", fontSize: 12, marginBottom: 6 }}>{lesson.instruction}</div>
                <div style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#ffa657",
                  letterSpacing: 0.5,
                }}>
                  {lesson.command.split("\n").map((line, i) => <div key={i}>{line}</div>)}
                </div>
              </div>
              <button
                onClick={() => setShowHint(v => !v)}
                style={{
                  background: "transparent",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#8b949e",
                  padding: "4px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                {showHint ? "ヒント非表示" : "💡 ヒント"}
              </button>
            </div>
            {showHint && (
              <div style={{
                marginTop: 8,
                background: "#161b22",
                border: "1px solid #f0883e55",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 11,
                color: "#f0883e",
              }}>
                💡 {lesson.hint}
              </div>
            )}
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div style={{
              background: feedback.type === "success" ? "#1a2a1a" : "#2a1a1a",
              borderBottom: `1px solid ${feedback.type === "success" ? "#3fb950" : "#f85149"}`,
              padding: "10px 20px",
              fontSize: 12,
              color: feedback.type === "success" ? "#3fb950" : "#f85149",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              {feedback.type === "success" ? "✅ 正解！" : "❌ "} {feedback.message}
              {feedback.type === "success" && currentLesson < LESSONS.length - 1 && (
                <span style={{ color: "#8b949e" }}>（3秒後に次のレッスンへ…）</span>
              )}
            </div>
          )}

          {/* Terminal */}
          <div
            ref={terminalRef}
            style={{
              flex: 1,
              background: "#010409",
              padding: "12px 16px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {terminalLines.map((line, i) => (
              <div key={i} style={{
                marginBottom: 2,
                color: line.type === "input" ? "#e6edf3"
                  : line.type === "success" ? "#3fb950"
                    : line.type === "error" ? "#f85149"
                      : "#484f58",
                lineHeight: 1.5,
              }}>
                {line.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            background: "#0d1117",
            borderTop: "1px solid #21262d",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: "#3fb950", fontSize: 13 }}>
              {gitState.currentBranch ? `(${gitState.currentBranch}) $ ` : "$ "}
            </span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${lesson.command.split("\n")[0]}  ← 入力してEnter`}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e6edf3",
                fontFamily: "monospace",
                fontSize: 13,
                caretColor: "#58a6ff",
              }}
              autoFocus
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: "#238636",
                border: "none",
                borderRadius: 6,
                color: "white",
                padding: "5px 14px",
                fontSize: 12,
                cursor: "pointer",
              }}>
              実行
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
