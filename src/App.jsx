import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, Lock, RefreshCw, ShieldAlert, Swords, Target, WandSparkles } from 'lucide-react';

const trapOptions = ['Added', 'Subtracted', 'Multiplied', 'Divided', 'Inside brackets'];
const allMoveOptions = [
  'Add the same number to both sides',
  'Subtract the same number from both sides',
  'Multiply both sides',
  'Divide both sides',
  'Expand brackets',
  'Simplify',
  'Factorise',
  'Split into factors',
  'Clear the fraction',
  'Apply exponent laws',
  'Simplify surds',
  'Graph it',
];

const levels = [
  {
    id: 1,
    title: 'Level 1: Easy Escapes',
    tagline: 'One simple trap',
    problems: ['x + 5 = 12', 'x - 4 = 9', 'x + 11 = 20', 'x - 7 = 3'],
  },
  {
    id: 2,
    title: 'Level 2: Double Traps',
    tagline: 'Reverse-order escape',
    problems: ['3x + 5 = 20', '2x - 6 = 10', '4x + 8 = 28', '5x - 15 = 10'],
  },
  {
    id: 3,
    title: 'Level 3: Boss Level',
    tagline: 'Brackets and bigger traps',
    problems: ['2(x + 3) = 14', '3(x - 2) = 15', '5(x + 1) = 30', '4(x - 1) = 20'],
  },
];

function cleanEquation(input) {
  return String(input || '').replace(/\s+/g, '').replace(/X/g, 'x');
}

function formatCoeff(coeff) {
  if (coeff === 1) return 'x';
  if (coeff === -1) return '-x';
  return `${coeff}x`;
}

function formatLinearExpression(coeff, constant = 0) {
  const base = formatCoeff(coeff);
  if (constant > 0) return `${base} + ${constant}`;
  if (constant < 0) return `${base} - ${Math.abs(constant)}`;
  return base;
}

function formatBracketExpression(outer, inner) {
  return `${outer}(x ${inner >= 0 ? '+' : '-'} ${Math.abs(inner)})`;
}

function parseEquation(equation) {
  const eq = cleanEquation(equation);

  let match = eq.match(/^([+-]?\d*)x([+-]\d+)?=(-?\d+)$/);
  if (match) {
    const rawCoeff = match[1];
    const coeff = rawCoeff === '' || rawCoeff === '+' ? 1 : rawCoeff === '-' ? -1 : Number(rawCoeff);
    const constant = match[2] ? Number(match[2]) : 0;
    const rhs = Number(match[3]);
    return { type: 'linear', coeff, constant, rhs };
  }

  match = eq.match(/^([+-]?\d*)\(x([+-]\d+)\)=(-?\d+)$/);
  if (match) {
    const rawOuter = match[1];
    const outer = rawOuter === '' || rawOuter === '+' ? 1 : rawOuter === '-' ? -1 : Number(rawOuter);
    const inner = Number(match[2]);
    const rhs = Number(match[3]);
    return { type: 'brackets', outer, inner, rhs };
  }

  return null;
}

function equationToString(parsed) {
  if (!parsed) return '';
  if (parsed.type === 'linear') return `${formatLinearExpression(parsed.coeff, parsed.constant)} = ${parsed.rhs}`;
  if (parsed.type === 'brackets') return `${formatBracketExpression(parsed.outer, parsed.inner)} = ${parsed.rhs}`;
  return '';
}

function detectTrap(parsed) {
  if (!parsed) return 'Unknown';
  if (parsed.type === 'brackets') return 'Inside brackets';
  if (parsed.constant > 0) return 'Added';
  if (parsed.constant < 0) return 'Subtracted';
  if (Math.abs(parsed.coeff) !== 1) return 'Multiplied';
  return 'Isolated';
}

function getAvailableMoves(parsed) {
  if (!parsed) return [];

  if (parsed.type === 'brackets') {
    const moves = [];
    if (Math.abs(parsed.outer) !== 1) moves.push('Divide both sides');
    moves.push('Expand brackets');
    if (moves.length === 0) moves.push('Simplify');
    return moves;
  }

  if (parsed.type === 'linear') {
    const moves = [];
    if (parsed.constant > 0) moves.push('Subtract the same number from both sides');
    if (parsed.constant < 0) moves.push('Add the same number to both sides');
    if (Math.abs(parsed.coeff) !== 1) moves.push('Divide both sides');
    if (parsed.coeff === -1) moves.push('Multiply both sides');
    if (moves.length === 0) moves.push('Simplify');
    return moves;
  }

  return ['Simplify'];
}

function buildPreviewStep(parsed, move) {
  if (!parsed || !move) return null;

  if (parsed.type === 'linear') {
    const before = equationToString(parsed);

    if (move === 'Subtract the same number from both sides' && parsed.constant > 0) {
      const afterParsed = { ...parsed, constant: 0, rhs: parsed.rhs - parsed.constant };
      return {
        before,
        action: `subtract ${Math.abs(parsed.constant)} from both sides`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === 'Add the same number to both sides' && parsed.constant < 0) {
      const afterParsed = { ...parsed, constant: 0, rhs: parsed.rhs - parsed.constant };
      return {
        before,
        action: `add ${Math.abs(parsed.constant)} to both sides`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === 'Divide both sides' && Math.abs(parsed.coeff) !== 1) {
      const afterParsed = { type: 'linear', coeff: 1, constant: 0, rhs: parsed.rhs / parsed.coeff };
      return {
        before,
        action: `divide both sides by ${parsed.coeff}`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === 'Multiply both sides' && parsed.coeff === -1) {
      const afterParsed = { type: 'linear', coeff: 1, constant: 0, rhs: -parsed.rhs };
      return {
        before,
        action: 'multiply both sides by -1',
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === 'Simplify' && Math.abs(parsed.coeff) === 1 && parsed.constant === 0) {
      return {
        before,
        action: 'x is already isolated',
        after: equationToString(parsed),
        nextParsed: parsed,
      };
    }
  }

  if (parsed.type === 'brackets') {
    const before = equationToString(parsed);

    if (move === 'Divide both sides' && Math.abs(parsed.outer) !== 1) {
      const afterParsed = { type: 'linear', coeff: 1, constant: parsed.inner, rhs: parsed.rhs / parsed.outer };
      return {
        before,
        action: `divide both sides by ${parsed.outer}`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === 'Expand brackets') {
      const afterParsed = {
        type: 'linear',
        coeff: parsed.outer,
        constant: parsed.outer * parsed.inner,
        rhs: parsed.rhs,
      };
      return {
        before,
        action: 'expand the brackets',
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }
  }

  return null;
}

function solveEquation(equation) {
  let parsed = parseEquation(equation);
  if (!parsed) return null;

  const steps = [];
  let guard = 0;

  while (parsed && guard < 10) {
    guard += 1;
    const moves = getAvailableMoves(parsed);
    const move = moves[0];
    const preview = buildPreviewStep(parsed, move);

    if (!preview) break;
    steps.push(preview);

    const unchanged = equationToString(preview.nextParsed) === equationToString(parsed);
    parsed = preview.nextParsed;

    if (unchanged || (parsed.type === 'linear' && parsed.coeff === 1 && parsed.constant === 0)) {
      break;
    }
  }

  if (parsed?.type === 'linear' && parsed.coeff === 1 && parsed.constant === 0) {
    return { solution: parsed.rhs, steps, finalParsed: parsed };
  }

  return { solution: null, steps, finalParsed: parsed };
}

function getProblem(levelIndex, problemIndex) {
  return levels[levelIndex].problems[problemIndex];
}

function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="section-title">
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}

function AppButton({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, outline = false }) {
  return <span className={`badge ${outline ? 'badge-outline' : ''}`.trim()}>{children}</span>;
}

function ProgressBar({ value }) {
  return (
    <div className="progress-shell">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState('level');
  const [levelIndex, setLevelIndex] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [customEquation, setCustomEquation] = useState('');
  const [guess, setGuess] = useState('');
  const [selectedTrap, setSelectedTrap] = useState('');
  const [selectedMove, setSelectedMove] = useState('');
  const [showEscapePlan, setShowEscapePlan] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [liveEquation, setLiveEquation] = useState('');
  const [history, setHistory] = useState([]);
  const [nextEquationInput, setNextEquationInput] = useState('');
  const [stepChecked, setStepChecked] = useState(false);
  const [stepCorrect, setStepCorrect] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundPrompt, setRoundPrompt] = useState('');
  const [walterMessage, setWalterMessage] = useState("Let’s cook… algebra.");
  const engineTopRef = useRef(null);

  const level = levels[levelIndex];
  const presetEquation = useMemo(() => getProblem(levelIndex, problemIndex), [levelIndex, problemIndex]);
  const baseEquation = mode === 'homework' ? customEquation.trim() : presetEquation;
  const activeEquation = liveEquation || baseEquation;
  const parsed = parseEquation(activeEquation);
  const trapHint = detectTrap(parsed);
  const availableMoves = getAvailableMoves(parsed);
  const suggestedMove = availableMoves[0] || 'Simplify';
  const previewStep = buildPreviewStep(parsed, selectedMove);
  const solved = solveEquation(activeEquation);
  const solution = solved?.solution;
  const totalProblems = levels.reduce((sum, lvl) => sum + lvl.problems.length, 0);
  const progress = Math.round((solvedCount / totalProblems) * 100);
  const isCorrect = activeEquation && solution !== null && guess !== '' && Number(guess) === solution;
  const missionComplete = parsed?.type === 'linear' && parsed.coeff === 1 && parsed.constant === 0;

  useEffect(() => {
    if ((roundNumber > 1 || missionComplete) && engineTopRef.current) {
      engineTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [roundNumber, missionComplete]);

  function resetMissionState(nextEquation = baseEquation) {
    setLiveEquation(nextEquation || '');
    setSelectedTrap('');
    setSelectedMove('');
    setShowEscapePlan(false);
    setSubmitted(false);
    setGuess('');
    setHistory([]);
    setNextEquationInput('');
    setStepChecked(false);
    setStepCorrect(false);
    setRoundNumber(1);
    setRoundPrompt('');
  }

  function loadEquation(nextEquation) {
    resetMissionState(nextEquation);
  }

  function startLevelMode() {
    setMode('level');
    setScreen('mission');
    setLevelIndex(0);
    setProblemIndex(0);
    setCustomEquation('');
    resetMissionState(levels[0].problems[0]);
  }

  function startHomeworkMode() {
    setMode('homework');
    setScreen('mission');
    resetMissionState(customEquation.trim());
  }

  function handleSubmit() {
    setSubmitted(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      if (mode === 'level') setSolvedCount((c) => c + 1);
    }
  }

  function checkStepAndAdvance() {
    if (!previewStep) return;

    const typed = cleanEquation(nextEquationInput);
    const expected = cleanEquation(previewStep.after);
    const correct = typed !== '' && typed === expected;

    setStepChecked(true);
    setStepCorrect(correct);

    if (!correct) {
      setWalterMessage('Nope. That doesn’t balance the books.');
      return;
    }

    const nextParsed = parseEquation(previewStep.after);

    setHistory((prev) => [...prev, previewStep]);
    setLiveEquation(previewStep.after);
    setSelectedTrap('');
    setSelectedMove('');
    setNextEquationInput('');
    setStepChecked(false);
    setStepCorrect(false);

    if (nextParsed?.type === 'linear' && nextParsed.coeff === 1 && nextParsed.constant === 0) {
      setWalterMessage('Good. X has broken free.');
      setRoundPrompt('');
      setRoundNumber((n) => n + 1);
      return;
    }

    setRoundNumber((n) => n + 1);
    setRoundPrompt('New equation. Start again: how is X trapped now, and what move makes sense here now?');
    setWalterMessage('X is still trapped. What’s the next move?');
  }

  

  function handleNextMission() {
    if (mode === 'homework') {
      resetMissionState(customEquation.trim());
      return;
    }

    const isLastInLevel = problemIndex === level.problems.length - 1;
    const isLastLevel = levelIndex === levels.length - 1;

    if (!isLastInLevel) {
      const nextIndex = problemIndex + 1;
      setProblemIndex(nextIndex);
      resetMissionState(level.problems[nextIndex]);
      return;
    }

    if (!isLastLevel) {
      const nextLevel = levelIndex + 1;
      setLevelIndex(nextLevel);
      setProblemIndex(0);
      resetMissionState(levels[nextLevel].problems[0]);
      return;
    }

    setLevelIndex(0);
    setProblemIndex(0);
    resetMissionState(levels[0].problems[0]);
  }

  function handleResetAll() {
    setScreen('home');
    setMode('level');
    setLevelIndex(0);
    setProblemIndex(0);
    setCustomEquation('');
    setSolvedCount(0);
    setScore(0);
    setLiveEquation('');
    setHistory([]);
    setGuess('');
    setSelectedTrap('');
    setSelectedMove('');
    setShowEscapePlan(false);
    setSubmitted(false);
  }

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="hero-card">
            <div className="hero-header">
              <div className="mini-card" style={{ marginBottom: '10px' }}>
                <strong>Walter says:</strong>
                <div>{walterMessage}</div>
              </div>
              <div className="badge-row">
                <Badge>Breaking Bad Algebra</Badge>
                <Badge outline>Break X out of the equation</Badge>
              </div>
              <div className="hero-grid">
                <div className="relative pr-24 md:pr-32">
                  <h1 className="hero-title">Breaking Bad Algebra</h1>
                  <p className="hero-copy">
                    X is your friend. X is trapped inside an equation. Your mission is to keep the equation balanced,
                    choose the right move, and break X out step by step.
                  </p>

                  <img
                    src="/walter-white-homework.jpg"
                    alt="Walter White asking about homework"
                    className="absolute top-0 right-[-20px] md:right-[-40px] w-24 md:w-32 opacity-90 pointer-events-none"
                  />
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Solved</div>
                    <div className="stat-value">{solvedCount}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Score</div>
                    <div className="stat-value">{score}</div>
                  </div>
                  <div className="stat-card span-two">
                    <div className="stat-row">
                      <span>Mission progress</span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {screen === 'home' ? (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid-two">
            <Card>
              <SectionTitle icon={Target}>How the game works</SectionTitle>
              <h2 className="card-title">Free X Engine</h2>
              <p className="card-copy">Learn the moves that break X out of the equation.</p>
              <div className="stack-gap">
                <div className="mini-card"><strong>1. Balance first</strong><span>Whatever you do to one side, you must do to the other.</span></div>
                <div className="mini-card"><strong>2. Find the trap</strong><span>Work out how X is trapped.</span></div>
                <div className="mini-card"><strong>3. Choose the move</strong><span>Only relevant moves unlock.</span></div>
                <div className="mini-card"><strong>4. Observe and repeat</strong><span>Each move updates the equation and unlocks the next set of moves.</span></div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={WandSparkles}>Choose your mode</SectionTitle>
              <h2 className="card-title">Start a mission</h2>
              <p className="card-copy">Practice with built-in levels or bring in a homework equation.</p>
              <div className="stack-gap">
                <AppButton onClick={startLevelMode}><Swords size={16} /> Start level mode</AppButton>
                <div className="mini-card">
                  <strong>Homework mode</strong>
                  <input
                    value={customEquation}
                    onChange={(e) => setCustomEquation(e.target.value)}
                    placeholder="Type an equation, e.g. 3x + 5 = 20"
                    className="text-input"
                  />
                  <AppButton variant="secondary" onClick={startHomeworkMode}><Home size={16} /> Use my homework equation</AppButton>
                  <span className="muted">Starter version supports simple linear and bracket equations.</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="mission-grid">
            <Card>
              <h2 className="card-title">Mission controls</h2>
              <p className="card-copy">Guide the moves that break X out of the equation.</p>
              <div className="stack-gap">
                <div className="mini-card">
                  <SectionTitle icon={ShieldAlert}>Balance first</SectionTitle>
                  <span>Every move must happen on both sides.</span>
                </div>
                <div className="mini-card">
                  <SectionTitle icon={Lock}>Trap detector</SectionTitle>
                  <span>Detected trap: <strong>{trapHint}</strong></span>
                  <span>Unlocked moves change after every step.</span>
                  <div className="pill-row">
                    {availableMoves.map((move) => <span key={move} className="pill">{move}</span>)}
                  </div>
                </div>

                {mode === 'level' && (
                  <div className="mini-card">
                    <strong>Levels</strong>
                    <div className="stack-gap small-gap">
                      {levels.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLevelIndex(idx);
                            setProblemIndex(0);
                            loadEquation(item.problems[0]);
                          }}
                          className={`level-btn ${idx === levelIndex ? 'level-btn-active' : ''}`}
                        >
                          <span>{item.title}</span>
                          <small>{item.tagline}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'homework' && (
                  <div className="mini-card">
                    <strong>Homework equation</strong>
                    <input
                      value={customEquation}
                      onChange={(e) => setCustomEquation(e.target.value)}
                      placeholder="Type an equation"
                      className="text-input"
                    />
                    <AppButton variant="secondary" onClick={() => loadEquation(customEquation.trim())}>Load equation</AppButton>
                  </div>
                )}

                <AppButton variant="secondary" onClick={handleResetAll}><RefreshCw size={16} /> Reset app</AppButton>
              </div>
            </Card>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <div className="badge-row mission-top-badges">
                  <Badge>{mode === 'level' ? level.title : 'Homework mode'}</Badge>
                  {mode === 'level' && <Badge outline>Problem {problemIndex + 1} of {level.problems.length}</Badge>}
                </div>
                <h2 className="card-title">Current mission</h2>
                <p className="card-copy">Break X out of the equation using guided moves.</p>

                                <div className="engine-box" ref={engineTopRef}>
                  {missionComplete && (
                    <div className="success-box" style={{ marginBottom: '12px' }}>
                      <strong>Mission complete.</strong>
                      <span>X is free. The next set of moves is no moves at all — because X is already out.</span>
                    </div>
                  )}
                  <div className="equation-box" style={{ marginBottom: '12px' }}>
                    <div className="equation-label">Current equation</div>
                    <div className="equation-text">{activeEquation || 'Type an equation to start'}</div>
                  </div>
                  {roundPrompt && <div className="muted">{roundPrompt}</div>}
                  <div>
                    <div className="step-label">Round {roundNumber} · Step 1</div>
                    <div className="step-title">Step 1. The equation must stay balanced. How is X trapped?</div>
                  </div>
                  <div className="option-grid">
                    {trapOptions.map((option) => (
                      <AppButton
                        key={option}
                        variant="secondary"
                        onClick={() => setSelectedTrap(option)}
                        className={selectedTrap === option ? 'selected' : ''}
                      >
                        {option}
                      </AppButton>
                    ))}
                  </div>
                  {selectedTrap && <p className="card-copy">You chose: <strong>{selectedTrap}</strong></p>}

                  <div>
                    <div className="step-label">Step 2</div>
                    <div className="card-copy">What move is the opposite of how X is trapped?</div>
                    {selectedMove === '' && availableMoves.length > 0 && (
                      <div className="muted">Hint: a good next move is <strong>{suggestedMove}</strong>.</div>
                    )}
                  </div>
                  <div className="option-grid">
                    {allMoveOptions.map((option) => {
                      const unlocked = availableMoves.includes(option);
                      return (
                        <AppButton
                          key={option}
                          variant="secondary"
                          disabled={!unlocked}
                          onClick={() => {
                            if (!unlocked) return;
                            setSelectedMove(option);
                            setNextEquationInput('');
                            setStepChecked(false);
                            setStepCorrect(false);
                          }}
                          className={`${selectedMove === option ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`.trim()}
                        >
                          {option} {unlocked ? '✅' : '🔒'}
                        </AppButton>
                      );
                    })}
                  </div>
                  {selectedMove && <p className="card-copy">You chose: <strong>{selectedMove}</strong></p>}
                  {availableMoves.length > 0 && <p className="muted">Only the moves that fit this exact stage of the equation are unlocked.</p>}

                  </div>

                <div className="mini-card observation-box">
                  <div className="step-label">Step 3</div>
                  <div className="step-title">Step 3. Apply your chosen move and type your new equation</div>
                  <div className="observation-panel">
                    <div className="obs-line">{activeEquation || 'Equation'}</div>
                    <div className="obs-arrow">↓ {selectedMove ? (previewStep?.action || 'Work out the next balanced equation') : ''}</div>
                    <div className="obs-line">{stepCorrect ? (previewStep?.after || '') : ''}</div>
                  </div>
                  <div className="stack-gap small-gap">
                    <strong>Type the new equation</strong>
                    <input
                      value={nextEquationInput}
                      onChange={(e) => {
                        setNextEquationInput(e.target.value);
                        setStepChecked(false);
                        setStepCorrect(false);
                      }}
                      placeholder="e.g. 3x = 15"
                      className="text-input"
                    />
                  </div>
                  <div className="yesno-row">
                    <AppButton variant="secondary" onClick={checkStepAndAdvance} disabled={!selectedMove || !previewStep}>Check move</AppButton>
                    <AppButton variant="secondary" onClick={() => setShowEscapePlan((s) => !s)}>{showEscapePlan ? 'Hide escape plan' : 'Show escape plan'}</AppButton>
                  </div>
                  {stepChecked && (
                    <div className={`feedback-box ${stepCorrect ? 'feedback-success' : 'feedback-error'}`}>
                      {stepCorrect ? (
                        <div>
                          <strong>Correct next step.</strong>
                          <div>Your new equation stays balanced.</div>
                        </div>
                      ) : (
                        <div>
                          <strong>Not quite yet.</strong>
                          <div>Try the next equation again before applying the move.</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>

                

                {history.length > 0 && (
                  <div className="mini-card">
                    <strong>Move history</strong>
                    <ol className="history-list">
                      {history.map((step, idx) => (
                        <li key={idx}>{step.before} → {step.action} → {step.after}</li>
                      ))}
                    </ol>
                  </div>
                )}

                

                
                  </div>
                )}

                {showEscapePlan && (
                  <div className="mini-card">
                    <strong>Escape plan</strong>
                    {solved?.steps?.length ? (
                      <ol className="history-list">
                        {solved.steps.map((step, idx) => (
                          <li key={idx}>{step.before} → {step.action} → {step.after}</li>
                        ))}
                      </ol>
                    ) : (
                      <div className="card-copy">Enter a supported equation to generate guided steps.</div>
                    )}
                  </div>
                )}

                <div className="yesno-row">
                  <AppButton variant="secondary" onClick={handleNextMission}>{mode === 'level' ? 'Next mission' : 'Reset mission'}</AppButton>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

       
      
