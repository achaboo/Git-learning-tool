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
    command: "git branch feature",
    hint: "git branch ブランチ名 で新しいブランチを作成します。この時点ではまだmainにいます。\n💡 ショートカット: git switch -c feature とすれば作成と切り替えを一度に行えます（-c は --create の略）",
    expectedAction: "branch_create",
    explanation: "git branch でブランチを作成します。ブランチは「作業スペースの分岐」です。この時点ではまだmainブランチにいます。次のステップでブランチを切り替えます。",
  },
  {
    id: 5,
    title: "ブランチへの切り替え",
    description: "作成したfeatureブランチに移動します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: "git switch feature",
    hint: "git switch ブランチ名 でブランチを切り替えます。\n💡 git switch -c（-c は --create の略）なら、作成と切り替えを一度にできます",
    expectedAction: "branch_switch",
    explanation: "git switch はGit 2.23で追加されたブランチ切り替えコマンドです。-c（--create）オプションをつけると git branch + git switch をまとめて実行できます。",
  },
  {
    id: 6,
    title: "featureブランチでコミット",
    description: "featureブランチで変更を記録します。",
    instruction: "以下のコマンドをGit Bashで実行してください：",
    command: 'git add .\ngit commit -m "featureブランチの変更"',
    hint: "featureブランチで git add . → git commit -m \"...\" の順に実行します",
    expectedAction: "commit_feature",
    explanation: "ブランチ上でのコミットはmainに影響しません。安全に作業を進められます。",
  },
  {
    id: 7,
    title: "mainへのマージ",
    description: "featureブランチをmainに合流させます。",
    instruction: "まずmainに戻り、マージします：",
    command: "git switch main\ngit merge feature",
    hint: "git switch main でmainに切り替えてから git merge feature を実行",
    expectedAction: "merge",
    explanation: "merge はブランチを合流させます。git switch はGit 2.23以降推奨の新コマンドです。featureの変更がmainに取り込まれ、ブランチ統合が完了します。",
  },
  {
    id: 8,
    title: "ブランチの削除",
    description: "マージ済みのfeatureブランチを削除して整理します。",
    instruction: "マージ済みのブランチを削除：",
    command: "git branch -d feature",
    hint: "git branch -d ブランチ名 でマージ済みのブランチを削除します。\n💡 -d は --delete の略。未マージのブランチを強制削除する場合は -D（大文字）を使います",
    expectedAction: "branch_delete",
    explanation: "git branch -d（--delete）はマージ済みのブランチを安全に削除します。-D（大文字）は未マージでも強制削除します。マージ後は不要なブランチを整理してリポジトリを清潔に保ちましょう。",
  },
  {
    id: 9,
    title: "コミット履歴の確認",
    description: "これまでのコミット履歴をコンパクトに表示します。",
    instruction: "1行ずつのログ表示：",
    command: "git log --oneline",
    hint: "git log --oneline で各コミットをID＋メッセージの1行形式で表示します",
    expectedAction: "log",
    explanation: "git log はコミット履歴を表示します。--oneline で短縮ハッシュとメッセージだけのコンパクト表示になります。git log --graph --oneline --all でブランチの分岐もグラフ表示できます。",
  },
  {
    id: 10,
    title: "リリースタグの作成",
    description: "現在のコミットにバージョンタグを付けます。",
    instruction: "v1.0 タグを作成：",
    command: "git tag v1.0",
    hint: "git tag タグ名 で現在のHEADコミットにタグを付けます。\n💡 タグはリリースや重要なバージョンに付ける「しおり」です。git push origin v1.0 でリモートに送れます",
    expectedAction: "tag",
    explanation: "git tag でコミットに名前（タグ）を付けます。v1.0 のようなバージョン番号に使うのが一般的です。軽量タグ（git tag v1.0）と注釈付きタグ（git tag -a v1.0 -m \"リリース\"）の2種類があります。",
  },
];

const initialGitState = {
  initialized: false,
  currentBranch: null,
  branches: {},
  stagingArea: [],
  workTree: ["README.md", "index.js", "style.css"],
  log: [],
  tags: [],
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
  } else if (cmd === "git branch feature") {
    if (!gitState.initialized || !gitState.branches.main) {
      result.message = "❌ 先にmainブランチでコミットしてください";
      return { newState, result };
    }
    if (gitState.branches.feature) {
      result.message = "⚠️ featureブランチはすでに存在します";
      return { newState, result };
    }
    newState.branches = { ...gitState.branches, feature: [] };
    result.success = true;
    result.message = "✅ Branch 'feature' created（まだmainにいます）";
    result.action = "branch_create";
  } else if (cmd === "git switch -c feature") {
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
    result.message = "✅ Switched to a new branch 'feature'（-c = --create のショートカット）";
    result.action = "branch_create";
  } else if (cmd === "git switch feature") {
    if (!gitState.branches.feature) {
      result.message = "❌ featureブランチが存在しません。先に git branch feature を実行してください";
      return { newState, result };
    }
    newState.currentBranch = "feature";
    result.success = true;
    result.message = "✅ Switched to branch 'feature'";
    result.action = "branch_switch";
  } else if (cmd === "git switch main") {
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
  } else if (cmd === "git branch -d feature") {
    // cmd is lowercased, so -D also matches as -d here
    // Check original input for uppercase -D (force delete)
    const forceDelete = input.trim().includes("-D");
    if (!gitState.branches?.feature) {
      result.message = "❌ featureブランチが存在しません";
      return { newState, result };
    }
    if (gitState.currentBranch === "feature") {
      result.message = "❌ 現在のブランチは削除できません。先に git switch main を実行してください";
      return { newState, result };
    }
    if (!forceDelete) {
      const featureCommits = gitState.branches.feature;
      const mainCommits = gitState.branches.main || [];
      const allMerged =
        featureCommits.length === 0 ||
        featureCommits.every(fc => mainCommits.some(mc => mc.id === fc.id));
      if (!allMerged) {
        result.message = "❌ featureブランチはマージされていません。強制削除は git branch -D feature（大文字D）";
        return { newState, result };
      }
    }
    const { feature: _removed, ...rest } = gitState.branches;
    newState.branches = rest;
    result.success = true;
    result.message = forceDelete
      ? "✅ Deleted branch feature（強制削除 -D）"
      : "✅ Deleted branch feature";
    result.action = "branch_delete";
  } else if (cmd === "git log --oneline" || cmd === "git log") {
    if (!gitState.initialized) {
      result.message = "❌ 先にgit initを実行してください";
      return { newState, result };
    }
    if (gitState.log.length === 0) {
      result.message = "（コミット履歴なし）";
      result.success = true;
      result.action = "log";
      return { newState, result };
    }
    const lines = [...gitState.log].reverse().map(c => {
      const tagLabels = (gitState.tags || [])
        .filter(t => t.commitId === c.id)
        .map(t => `tag: ${t.name}`)
        .join(", ");
      const ref = tagLabels ? ` (${tagLabels})` : "";
      return `${c.id}  ${c.message}  [${c.branch}]${ref}`;
    });
    result.success = true;
    result.message = lines.join("\n");
    result.action = "log";
  } else if (cmd.startsWith("git tag")) {
    const tagArgs = input.trim().slice(7).trim();
    if (!tagArgs) {
      // List tags
      const tags = gitState.tags || [];
      if (tags.length === 0) {
        result.message = "（タグなし）";
      } else {
        result.message = tags.map(t => `${t.name}  →  ${t.commitId}`).join("\n");
      }
      result.success = true;
      result.action = "tag_list";
      return { newState, result };
    }
    if (tagArgs.startsWith("-d ")) {
      const tagName = tagArgs.slice(3).trim();
      const existingTags = gitState.tags || [];
      if (!existingTags.some(t => t.name === tagName)) {
        result.message = `❌ タグ '${tagName}' が見つかりません`;
        return { newState, result };
      }
      newState.tags = existingTags.filter(t => t.name !== tagName);
      result.success = true;
      result.message = `✅ タグ '${tagName}' を削除しました`;
      result.action = "tag_delete";
      return { newState, result };
    }
    if (!gitState.initialized || !gitState.log.length) {
      result.message = "❌ 先にコミットを作成してください";
      return { newState, result };
    }
    if ((gitState.tags || []).some(t => t.name === tagArgs)) {
      result.message = `⚠️ タグ '${tagArgs}' はすでに存在します`;
      return { newState, result };
    }
    const branchCommits = gitState.branches[gitState.currentBranch] || [];
    const latestCommit = branchCommits[branchCommits.length - 1];
    if (!latestCommit) {
      result.message = "❌ コミットが見つかりません";
      return { newState, result };
    }
    newState.tags = [...(gitState.tags || []), { name: tagArgs, commitId: latestCommit.id }];
    result.success = true;
    result.message = `✅ タグ '${tagArgs}' を作成しました（コミット: ${latestCommit.id}）`;
    result.action = "tag";
  } else if (cmd === "git status") {
    if (!gitState.initialized) {
      result.message = "❌ 先にgit initを実行してください";
      return { newState, result };
    }
    const staged = gitState.stagingArea;
    const untracked = gitState.workTree.filter(f => !staged.includes(f));
    const lines = [`On branch ${gitState.currentBranch}`];
    if (staged.length > 0) {
      lines.push("\nChanges to be committed:");
      staged.forEach(f => lines.push(`\tnew file:   ${f}`));
    }
    if (untracked.length > 0) {
      lines.push("\nUntracked files:");
      untracked.forEach(f => lines.push(`\t${f}`));
    }
    if (staged.length === 0 && untracked.length === 0) {
      lines.push("nothing to commit, working tree clean");
    }
    result.success = true;
    result.message = lines.join("\n");
    result.action = "status";
  } else if (cmd === "git branch" || cmd === "git branch -a" || cmd === "git branch -v") {
    if (!gitState.initialized) {
      result.message = "❌ 先にgit initを実行してください";
      return { newState, result };
    }
    const branchNames = Object.keys(gitState.branches);
    if (branchNames.length === 0) {
      result.message = "（ブランチなし）";
    } else {
      result.message = branchNames.map(b =>
        `${b === gitState.currentBranch ? "* " : "  "}${b}`
      ).join("\n");
    }
    result.success = true;
    result.action = "branch_list";
  } else {
    result.message = `❓ 不明なコマンド: "${input.trim()}"`;
  }

  return { newState, result };
}

// ============================================================
// SVG FLOW DIAGRAM
// ============================================================
function FlowDiagram({ gitState }) {
  const { initialized, branches, currentBranch, stagingArea, workTree, tags } = gitState;

  const mainCommits = branches.main || [];
  const featureCommits = branches.feature || [];
  const hasFeature = !!branches.feature;

  // レイアウト定数
  const MY = 158;   // mainコミットのy座標
  const FY = 265;   // featureコミットのy座標（mainメッセージとの重なりを避けるため余白確保）
  const STEP = 90;  // コミット間の水平間隔
  const MX0 = 415;  // mainコミット開始x

  return (
    <svg viewBox="0 0 820 322" width="100%" height="100%" style={{ display: "block" }}>
      {/* Background */}
      <rect x="0" y="0" width="820" height="322" rx="12" fill="#0d1117" />

      {/* ===== WORK AREA SECTION ===== */}
      {/* ワークツリー */}
      <rect x="10" y="60" width="140" height="140" rx="8" fill="#0f1a2e" stroke="#1e40af" strokeWidth="1.5" />
      <text x="80" y="82" textAnchor="middle" fill="#93c5fd" fontSize="12" fontFamily="monospace">ワークツリー</text>
      {workTree.map((f, i) => (
        <g key={f}>
          <rect x="18" y={92 + i * 28} width="124" height="20" rx="4" fill="#1e3a5f" />
          <text x="80" y={106 + i * 28} textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="monospace">{f}</text>
        </g>
      ))}

      {/* 矢印: WorkTree → Staging */}
      <line x1="152" y1="130" x2="178" y2="130"
        stroke={stagingArea.length > 0 ? "#22c55e" : "#30363d"}
        strokeWidth="2.5" markerEnd="url(#arr)" />
      <text x="165" y="148" textAnchor="middle"
        fill={stagingArea.length > 0 ? "#22c55e" : "#484f58"}
        fontSize="9" fontFamily="monospace">add</text>

      {/* ステージング */}
      <rect x="180" y="60" width="140" height="140" rx="8"
        fill="#0f1e12"
        stroke={stagingArea.length > 0 ? "#22c55e" : "#166534"}
        strokeWidth={stagingArea.length > 0 ? 2.5 : 1.5}
      />
      <text x="250" y="82" textAnchor="middle" fill="#86efac" fontSize="12" fontFamily="monospace">ステージング</text>
      {stagingArea.length === 0
        ? <text x="250" y="135" textAnchor="middle" fill="#484f58" fontSize="10" fontFamily="monospace">（空）</text>
        : stagingArea.map((f, i) => (
          <g key={f}>
            <rect x="188" y={92 + i * 28} width="124" height="20" rx="4" fill="#14532d" />
            <text x="250" y={106 + i * 28} textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace">{f}</text>
          </g>
        ))
      }

      {/* 矢印: Staging → Repo */}
      <line x1="322" y1="130" x2="348" y2="130"
        stroke={initialized ? "#fb923c" : "#30363d"}
        strokeWidth="2.5" markerEnd="url(#arr2)" />
      <text x="335" y="148" textAnchor="middle"
        fill={initialized ? "#fb923c" : "#484f58"}
        fontSize="9" fontFamily="monospace">commit</text>

      {/* ===== REPOSITORY SECTION ===== */}
      <rect x="350" y="10" width="462" height="308" rx="10"
        fill="#0d1117" stroke="#30363d" strokeWidth="1" strokeDasharray="4 2" />
      <text x="581" y="28" textAnchor="middle" fill="#8b949e" fontSize="11" fontFamily="monospace">リポジトリ（.git）</text>

      {/* mainブランチラベル — ファイルバッジの上に配置 */}
      <text x="362" y="50" fill="#60a5fa" fontSize="13" fontFamily="monospace" fontWeight="bold">main</text>
      {!initialized && (
        <text x="560" y={MY + 4} textAnchor="middle" fill="#484f58" fontSize="10" fontFamily="monospace">（未初期化）</text>
      )}

      {/* mainのコミットノード */}
      {mainCommits.map((c, i) => {
        const x = MX0 + i * STEP;
        const y = MY;
        const isMergeCommit = featureCommits.includes(c);
        const r = isMergeCommit ? 18 : 15;
        const isHead = currentBranch === "main" && i === mainCommits.length - 1;
        const commitTags = (tags || []).filter(t => t.commitId === c.id);
        return (
          <g key={c.id}>
            {i > 0 && (
              <line
                x1={MX0 + (i - 1) * STEP + 15} y1={y}
                x2={x - 15} y2={y}
                stroke="#3b82f6" strokeWidth="3"
              />
            )}
            {/* ファイルバッジ（コミット円の上側 — "main"ラベルより下に収まる位置） */}
            {c.files.map((f, fi) => (
              <g key={fi}>
                <rect x={x - 30} y={y - 52 - fi * 20} width="60" height="16" rx="3" fill="#1e3a5f" />
                <text x={x} y={y - 40 - fi * 20} textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="monospace">{f}</text>
              </g>
            ))}
            <circle cx={x} cy={y} r={r}
              fill={isMergeCommit ? "#7c3aed" : "#1d4ed8"}
              stroke={isHead ? "#fbbf24" : isMergeCommit ? "#c084fc" : "#60a5fa"}
              strokeWidth={isHead ? 3.5 : 2}
            />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace">{c.id}</text>
            {isHead && (
              <>
                <rect x={x - 22} y={y + r + 5} width="44" height="16" rx="3" fill="#f59e0b" opacity="0.95" />
                <text x={x} y={y + r + 16} textAnchor="middle" fill="#0d1117" fontSize="9" fontWeight="bold" fontFamily="monospace">HEAD</text>
              </>
            )}
            {/* タグバッジ */}
            {commitTags.map((t, ti) => (
              <g key={t.name}>
                <rect x={x - 28} y={y + r + (isHead ? 30 : 5) + ti * 20} width="56" height="15" rx="3" fill="#d97706" opacity="0.95" />
                <text x={x} y={y + r + (isHead ? 41 : 16) + ti * 20} textAnchor="middle" fill="#0d1117" fontSize="8.5" fontWeight="bold" fontFamily="monospace">🏷 {t.name}</text>
              </g>
            ))}
            <text x={x} y={y + r + (isHead ? 38 : 24) + commitTags.length * 20}
              textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace">
              {c.message.slice(0, 12)}
            </text>
          </g>
        );
      })}

      {/* featureブランチ */}
      {hasFeature && (
        <>
          <text x="362" y={FY - 20} fill="#4ade80" fontSize="13" fontFamily="monospace" fontWeight="bold">feature</text>
          {mainCommits.length > 0 && (
            <line
              x1={MX0 + (mainCommits.length - 1) * STEP}
              y1={MY + 15}
              x2={MX0 + mainCommits.length * STEP}
              y2={FY - 15}
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
          )}
          {featureCommits.map((c, i) => {
            const x = MX0 + (mainCommits.length + i) * STEP;
            const y = FY;
            const isHead = currentBranch === "feature" && i === featureCommits.length - 1;
            return (
              <g key={c.id}>
                {i > 0 && (
                  <line
                    x1={MX0 + (mainCommits.length + i - 1) * STEP + 15} y1={y}
                    x2={x - 15} y2={y}
                    stroke="#22c55e" strokeWidth="3"
                  />
                )}
                <circle cx={x} cy={y} r={15}
                  fill="#15803d"
                  stroke={isHead ? "#fbbf24" : "#4ade80"}
                  strokeWidth={isHead ? 3.5 : 2}
                />
                <text x={x} y={y + 4} textAnchor="middle" fill="#86efac" fontSize="8" fontFamily="monospace">{c.id}</text>
                {isHead && (
                  <>
                    <rect x={x - 22} y={y + 19} width="44" height="16" rx="3" fill="#f59e0b" opacity="0.95" />
                    <text x={x} y={y + 30} textAnchor="middle" fill="#0d1117" fontSize="9" fontWeight="bold" fontFamily="monospace">HEAD</text>
                  </>
                )}
                <text x={x} y={y + (isHead ? 46 : 34)}
                  textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace">
                  {c.message.slice(0, 12)}
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* 矢印マーカー */}
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#22c55e" />
        </marker>
        <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#fb923c" />
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
  const terminalRef = useRef(null);
  const stateRef = useRef(null);
  const lessonListRef = useRef(null);
  const activeLessonItemRef = useRef(null);
  const inputRef = useRef(null);

  const lesson = LESSONS[currentLesson];
  const allDone = currentLesson === LESSONS.length - 1 && completedLessons.includes(lesson.id);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // 状態パネルを最新状態が見えるよう自動スクロール
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.scrollTop = stateRef.current.scrollHeight;
    }
  }, [gitState]);

  useEffect(() => {
    setShowHint(false);
  }, [currentLesson]);

  // レッスンリストを現在のレッスンが見えるよう自動スクロール
  useEffect(() => {
    if (activeLessonItemRef.current) {
      activeLessonItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentLesson]);

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
      }
    } else {
      setFeedback({ type: "error", message: result.message });
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  function handleSkip() {
    setCurrentLesson(prev => prev + 1);
    setFeedback(null);
    setShowHint(false);
  }

  function handleNextOrReset() {
    const willBeAllDone = currentLesson === LESSONS.length - 1;
    if (willBeAllDone) {
      // 全レッスン完了 → 初期状態へリセット
      setGitState(initialGitState);
      setCurrentLesson(0);
      setCompletedLessons([]);
      setTerminalLines([
        { type: "system", text: "🎓 Git学習ターミナル（シミュレーター）" },
        { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
        { type: "system", text: "⚡ コマンドを入力してEnterを押してください" },
      ]);
      setInputValue("");
      setShowHint(false);
    } else {
      // 次のレッスンへ進む
      setCurrentLesson(prev => prev + 1);
    }
    setFeedback(null);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const progress = (completedLessons.length / LESSONS.length) * 100;

  return (
    <div style={{
      height: "100vh",
      background: "#010409",
      color: "#e6edf3",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
        borderBottom: "1px solid #21262d",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 26 }}>🌿</span>
          <span style={{ fontSize: 22, fontWeight: "bold", color: "#58a6ff", letterSpacing: 1 }}>Git Visual Trainer</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#8b949e", fontSize: 16 }}>進捗</span>
          <div style={{ width: 130, height: 7, background: "#21262d", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #238636, #3fb950)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <span style={{ color: "#3fb950", fontSize: 16 }}>{completedLessons.length}/{LESSONS.length}</span>
        </div>
        {gitState.currentBranch && (
          <div style={{
            background: "#21262d",
            border: "1px solid #30363d",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 16,
            color: gitState.currentBranch === "main" ? "#58a6ff" : "#3fb950",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>⎇</span>
            <span>{gitState.currentBranch}</span>
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT (ヘッダー直下から) ===== */}
      <div style={{ display: "flex", flex: 1, gap: 0, overflow: "hidden", minHeight: 0 }}>

        {/* ===== LEFT: LESSON PANEL ===== */}
        <div style={{
          width: 310,
          background: "#0d1117",
          borderRight: "1px solid #21262d",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* ── LESSON SECTION: 均等50% ── */}
          <div style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            borderBottom: "1px solid #21262d",
            overflow: "hidden",
          }}>
            {/* 固定ヘッダー */}
            <div style={{
              padding: "10px 14px 8px",
              flexShrink: 0,
              borderBottom: "1px solid #30363d",
            }}>
              <div style={{ color: "#8b949e", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>📚 レッスン</div>
            </div>
            {/* スクロール可能なリスト */}
            <div ref={lessonListRef} style={{
              flex: 1,
              overflowY: "auto",
              padding: "6px 14px 8px",
              minHeight: 0,
            }}>
              {LESSONS.map((l, i) => {
                const done = completedLessons.includes(l.id);
                const active = i === currentLesson;
                return (
                  <div key={l.id}
                    ref={active ? activeLessonItemRef : null}
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
                    <span style={{ fontSize: 16 }}>{done ? "✅" : active ? "▶️" : "⬜"}</span>
                    <div style={{ fontSize: 15, color: active ? "#58a6ff" : done ? "#3fb950" : "#8b949e", fontWeight: active ? "bold" : "normal" }}>
                      {l.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── STATE SECTION: 均等50% ── */}
          <div style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}>
            {/* 固定ヘッダー */}
            <div style={{
              padding: "10px 14px 8px",
              flexShrink: 0,
              borderBottom: "1px solid #30363d",
            }}>
              <div style={{ color: "#8b949e", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>🗂 状態</div>
            </div>
            {/* スクロール可能なコンテンツ */}
            <div ref={stateRef} style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 14px",
              minHeight: 0,
            }}>
              {/* ステージング */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#484f58", fontSize: 13, marginBottom: 4 }}>ステージング</div>
                {gitState.stagingArea.length === 0
                  ? <div style={{ color: "#484f58", fontSize: 13, fontStyle: "italic" }}>空</div>
                  : gitState.stagingArea.map(f => (
                    <div key={f} style={{ background: "#1a2a1a", border: "1px solid #3fb950", borderRadius: 4, padding: "3px 8px", fontSize: 13, color: "#3fb950", marginBottom: 3 }}>{f}</div>
                  ))
                }
              </div>

              {/* コミット履歴 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#484f58", fontSize: 13, marginBottom: 4 }}>コミット履歴</div>
                {gitState.log.length === 0
                  ? <div style={{ color: "#484f58", fontSize: 13, fontStyle: "italic" }}>なし</div>
                  : [...gitState.log].reverse().map(c => (
                    <div key={c.id} style={{ marginBottom: 5, borderLeft: `2px solid ${c.branch === "main" ? "#1f6feb" : "#3fb950"}`, paddingLeft: 8 }}>
                      <div style={{ fontSize: 13, color: "#8b949e" }}>
                        {c.id}{" "}
                        <span style={{ color: c.branch === "main" ? "#58a6ff" : "#3fb950" }}>[{c.branch}]</span>
                        {(gitState.tags || []).filter(t => t.commitId === c.id).map(t => (
                          <span key={t.name} style={{ marginLeft: 4, background: "#d29922", color: "#0d1117", borderRadius: 3, padding: "1px 5px", fontSize: 11, fontWeight: "bold" }}>🏷{t.name}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 14, color: "#e6edf3" }}>{c.message}</div>
                      <div style={{ fontSize: 12, color: "#484f58" }}>{c.files.join(", ")}</div>
                    </div>
                  ))
                }
              </div>

              {/* タグ一覧 */}
              {(gitState.tags || []).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: "#484f58", fontSize: 13, marginBottom: 4 }}>タグ</div>
                  {gitState.tags.map(t => (
                    <div key={t.name} style={{ background: "#2a2200", border: "1px solid #d29922", borderRadius: 4, padding: "3px 8px", fontSize: 13, color: "#d29922", marginBottom: 3 }}>
                      🏷 {t.name} → {t.commitId}
                    </div>
                  ))}
                </div>
              )}

              {/* ブランチ一覧 */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "#484f58", fontSize: 13, marginBottom: 4 }}>ブランチ</div>
                {Object.keys(gitState.branches).length === 0
                  ? <div style={{ color: "#484f58", fontSize: 13, fontStyle: "italic" }}>なし</div>
                  : Object.keys(gitState.branches).map(b => (
                    <div key={b} style={{ fontSize: 13, color: b === gitState.currentBranch ? "#ffa657" : "#8b949e", marginBottom: 2 }}>
                      {b === gitState.currentBranch ? "▶ " : "  "}{b}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: FLOW（上50%）+ ターミナル（下50%）===== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

          {/* ── TOP 50%: GIT フロー可視化 ── */}
          <div style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            borderBottom: "1px solid #21262d",
            overflow: "hidden",
            minHeight: 0,
          }}>
            {/* 固定ヘッダー */}
            <div style={{
              padding: "5px 16px 4px",
              flexShrink: 0,
              borderBottom: "1px solid #21262d",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "#8b949e", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>
                📊 Git フロー可視化
              </span>
              <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#484f58" }}>
                <span>🔵 mainコミット</span>
                <span>🟢 featureコミット</span>
                <span>🟠 HEAD（現在位置）</span>
                <span>🟣 マージコミット</span>
              </div>
            </div>
            {/* SVGフロー図（残りの高さを埋める） */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <FlowDiagram gitState={gitState} />
            </div>
          </div>

          {/* ── BOTTOM 50%: 先生 + ターミナル + 入力 ── */}
          <div style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}>

            {/* Teacher instruction */}
            <div style={{
              background: "linear-gradient(135deg, #0d1f0d 0%, #0d1117 100%)",
              borderBottom: "1px solid #21262d",
              padding: "10px 16px",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 30, flexShrink: 0 }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#3fb950", fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>
                    レッスン {lesson.id}/{LESSONS.length}: {lesson.title}
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 15, marginBottom: 4 }}>{lesson.description}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {lesson.id < LESSONS.length && (
                    <button
                      onClick={handleSkip}
                      style={{
                        background: "transparent",
                        border: "1px solid #30363d",
                        borderRadius: 6,
                        color: "#6e7681",
                        padding: "5px 12px",
                        fontSize: 14,
                        cursor: "pointer",
                      }}>
                      ⏭ スキップ
                    </button>
                  )}
                  <button
                    onClick={() => setShowHint(v => !v)}
                    style={{
                      background: showHint ? "#1a1a0a" : "transparent",
                      border: `1px solid ${showHint ? "#f0883e" : "#30363d"}`,
                      borderRadius: 6,
                      color: showHint ? "#f0883e" : "#8b949e",
                      padding: "5px 12px",
                      fontSize: 14,
                      cursor: "pointer",
                    }}>
                    {showHint ? "ヒント非表示" : "💡 ヒント"}
                  </button>
                </div>
              </div>
              {showHint && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontFamily: "monospace",
                    fontSize: 17,
                    color: "#ffa657",
                    letterSpacing: 0.5,
                  }}>
                    {lesson.command.split("\n").map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                  <div style={{
                    background: "#161b22",
                    border: "1px solid #f0883e55",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 15,
                    color: "#f0883e",
                  }}>
                    💡 {lesson.hint}
                  </div>
                </div>
              )}
            </div>

            {/* Feedback banner */}
            {feedback && (
              <div style={{
                background: feedback.type === "success" ? "#1a2a1a" : "#2a1a1a",
                borderBottom: `1px solid ${feedback.type === "success" ? "#3fb950" : "#f85149"}`,
                padding: "8px 16px",
                fontSize: 15,
                color: feedback.type === "success" ? "#3fb950" : "#f85149",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}>
                {feedback.type === "success" ? "✅ 正解！" : "❌ "} {feedback.message}
                {feedback.type === "success" && !allDone && (
                  <button
                    onClick={handleNextOrReset}
                    style={{
                      marginLeft: "auto",
                      background: allDone ? "#7c3aed" : "#1d4ed8",
                      border: "none",
                      borderRadius: 6,
                      color: "white",
                      padding: "5px 14px",
                      fontSize: 14,
                      cursor: "pointer",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}>
                    {allDone ? "🔄 最初からやり直す" : "次のレッスンへ ▶"}
                  </button>
                )}
              </div>
            )}

            {/* 全レッスン完了バナー */}
            {allDone && (
              <div style={{
                background: "linear-gradient(135deg, #1a2a1a, #0d1f2a)",
                borderBottom: "2px solid #3fb950",
                padding: "10px 16px",
                fontSize: 17,
                color: "#3fb950",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                flexShrink: 0,
              }}>
                🎉 全{LESSONS.length}レッスン完了！お疲れ様でした！ Git の基本ワークフローをマスターしました 🎉
                <button
                  onClick={handleNextOrReset}
                  style={{
                    background: "#7c3aed",
                    border: "none",
                    borderRadius: 6,
                    color: "white",
                    padding: "6px 16px",
                    fontSize: 15,
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}>
                  🔄 最初からやり直す
                </button>
              </div>
            )}

            {/* Terminal */}
            <div
              ref={terminalRef}
              style={{
                flex: 1,
                background: "#010409",
                padding: "10px 16px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: 16,
                minHeight: 0,
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
                  lineHeight: 1.6,
                }}>
                  {/* 複数行出力（git log等）に対応 */}
                  {line.text.split("\n").map((t, j) => (
                    <div key={j}>{t}</div>
                  ))}
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
              flexShrink: 0,
            }}>
              <span style={{ color: "#3fb950", fontSize: 17, whiteSpace: "nowrap" }}>
                {gitState.currentBranch ? `(${gitState.currentBranch}) $ ` : "$ "}
              </span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={showHint ? lesson.command.split("\n")[0] : "コマンドを入力してEnterを押す"}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e6edf3",
                  fontFamily: "monospace",
                  fontSize: 17,
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
                  padding: "7px 18px",
                  fontSize: 16,
                  cursor: "pointer",
                }}>
                実行
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
