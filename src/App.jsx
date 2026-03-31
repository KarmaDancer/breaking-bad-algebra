import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock, RefreshCw, Target, ShieldAlert, Swords, Home, WandSparkles } from "lucide-react";

const trapOptions = ["Added", "Subtracted", "Multiplied", "Divided", "Inside brackets"];
const allMoveOptions = [
  "Add the same number to both sides",
  "Subtract the same number from both sides",
  "Multiply both sides",
  "Divide both sides",
  "Expand brackets",
  "Simplify",
  "Factorise",
  "Split into factors",
  "Clear the fraction",
  "Apply exponent laws",
  "Simplify surds",
  "Graph it",
];

const levels = [
  {
    id: 1,
    title: "Level 1: Easy Escapes",
    tagline: "One simple trap",
    problems: ["x + 5 = 12", "x - 4 = 9", "x + 11 = 20", "x - 7 = 3"],
  },
  {
    id: 2,
    title: "Level 2: Double Traps",
    tagline: "Reverse-order escape",
    problems: ["3x + 5 = 20", "2x - 6 = 10", "4x + 8 = 28", "5x - 15 = 10"],
  },
  {
    id: 3,
    title: "Level 3: Boss Level",
    tagline: "Brackets and bigger traps",
    problems: ["2(x + 3) = 14", "3(x - 2) = 15", "5(x + 1) = 30", "4(x - 1) = 20"],
  },
];

function cleanEquation(input) {
  return input.replace(/\s+/g, "").replace(/X/g, "x");
}

function formatCoeff(coeff) {
  if (coeff === 1) return "x";
  if (coeff === -1) return "-x";
  return `${coeff}x`;
}

function formatLinearExpression(coeff, constant = 0) {
  const base = formatCoeff(coeff);
  if (constant > 0) return `${base} + ${constant}`;
  if (constant < 0) return `${base} - ${Math.abs(constant)}`;
  return base;
}

function formatBracketExpression(outer, inner) {
  return `${outer}(x ${inner >= 0 ? "+" : "-"} ${Math.abs(inner)})`;
}

function parseEquation(equation) {
  const eq = cleanEquation(equation || "");

  let match = eq.match(/^([+-]?\d*)x([+-]\d+)?=(-?\d+)$/);
  if (match) {
    const rawCoeff = match[1];
    const coeff = rawCoeff === "" || rawCoeff === "+" ? 1 : rawCoeff === "-" ? -1 : Number(rawCoeff);
    const constant = match[2] ? Number(match[2]) : 0;
    const rhs = Number(match[3]);
    return { type: "linear", coeff, constant, rhs };
  }

  match = eq.match(/^([+-]?\d*)\(x([+-]\d+)\)=(-?\d+)$/);
  if (match) {
    const rawOuter = match[1];
    const outer = rawOuter === "" || rawOuter === "+" ? 1 : rawOuter === "-" ? -1 : Number(rawOuter);
    const inner = Number(match[2]);
    const rhs = Number(match[3]);
    return { type: "brackets", outer, inner, rhs };
  }

  return null;
}

function equationToString(parsed) {
  if (!parsed) return "";
  if (parsed.type === "linear") return `${formatLinearExpression(parsed.coeff, parsed.constant)} = ${parsed.rhs}`;
  if (parsed.type === "brackets") return `${formatBracketExpression(parsed.outer, parsed.inner)} = ${parsed.rhs}`;
  return "";
}

function detectTrap(parsed) {
  if (!parsed) return "Unknown";
  if (parsed.type === "brackets") return "Inside brackets";
  if (parsed.constant > 0) return "Added";
  if (parsed.constant < 0) return "Subtracted";
  if (Math.abs(parsed.coeff) !== 1) return "Multiplied";
  return "Isolated";
}

function getAvailableMoves(parsed) {
  if (!parsed) return [];
  if (parsed.type === "brackets") {
    const moves = [];
    if (Math.abs(parsed.outer) !== 1) moves.push("Divide both sides");
    moves.push("Expand brackets");
    if (moves.length === 0) moves.push("Simplify");
    return moves;
  }
  if (parsed.type === "linear") {
    const moves = [];
    if (parsed.constant > 0) moves.push("Subtract the same number from both sides");
    if (parsed.constant < 0) moves.push("Add the same number to both sides");
    if (Math.abs(parsed.coeff) !== 1) moves.push("Divide both sides");
    if (parsed.coeff === -1) moves.push("Multiply both sides");
    if (moves.length === 0) moves.push("Simplify");
    return moves;
  }
  return ["Simplify"];
}

function buildPreviewStep(parsed, move) {
  if (!parsed || !move) return null;

  if (parsed.type === "linear") {
    const before = equationToString(parsed);

    if (move === "Subtract the same number from both sides" && parsed.constant > 0) {
      const afterParsed = { ...parsed, constant: 0, rhs: parsed.rhs - parsed.constant };
      return {
        before,
        action: `subtract ${Math.abs(parsed.constant)} from both sides`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === "Add the same number to both sides" && parsed.constant < 0) {
      const afterParsed = { ...parsed, constant: 0, rhs: parsed.rhs - parsed.constant };
      return {
        before,
        action: `add ${Math.abs(parsed.constant)} to both sides`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === "Divide both sides" && Math.abs(parsed.coeff) !== 1) {
      const afterParsed = { type: "linear", coeff: 1, constant: 0, rhs: parsed.rhs / parsed.coeff };
      return {
        before,
        action: `divide both sides by ${parsed.coeff}`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === "Multiply both sides" && parsed.coeff === -1) {
      const afterParsed = { type: "linear", coeff: 1, constant: 0, rhs: -parsed.rhs };
      return {
        before,
        action: "multiply both sides by -1",
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === "Simplify" && Math.abs(parsed.coeff) === 1 && parsed.constant === 0) {
      return {
        before,
        action: "x is already isolated",
        after: equationToString(parsed),
        nextParsed: parsed,
      };
    }
  }

  if (parsed.type === "brackets") {
    const before = equationToString(parsed);

    if (move === "Divide both sides" && Math.abs(parsed.outer) !== 1) {
      const afterParsed = { type: "linear", coeff: 1, constant: parsed.inner, rhs: parsed.rhs / parsed.outer };
      return {
        before,
        action: `divide both sides by ${parsed.outer}`,
        after: equationToString(afterParsed),
        nextParsed: afterParsed,
      };
    }

    if (move === "Expand brackets") {
      const afterParsed = {
        type: "linear",
        coeff: parsed.outer,
        constant: parsed.outer * parsed.inner,
        rhs: parsed.rhs,
      };
      return {
        before,
        action: "expand the brackets",
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

    if (unchanged || (parsed.type === "linear" && parsed.coeff === 1 && parsed.constant === 0)) {
      break;
    }
  }

  if (parsed?.type === "linear" && parsed.coeff === 1 && parsed.constant === 0) {
    return { solution: parsed.rhs, steps, finalParsed: parsed };
  }

  return { solution: null, steps, finalParsed: parsed };
}

function getProblem(levelIndex, problemIndex) {
  return levels[levelIndex].problems[problemIndex];
}

export default function BreakingBadAlgebraPracticeApp() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("level");
  const [levelIndex, setLevelIndex] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [customEquation, setCustomEquation] = useState("");
  const [guess, setGuess] = useState("");
  const [selectedTrap, setSelectedTrap] = useState("");
  const [selectedMove, setSelectedMove] = useState("");
  const [appliesToBothSides, setAppliesToBothSides] = useState(null);
  const [balancedAnswer, setBalancedAnswer] = useState(null);
  const [showEscapePlan, setShowEscapePlan] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [liveEquation, setLiveEquation] = useState("");
  const [history, setHistory] = useState([]);

  const level = levels[levelIndex];
  const presetEquation = useMemo(() => getProblem(levelIndex, problemIndex), [levelIndex, problemIndex]);
  const baseEquation = mode === "homework" ? customEquation.trim() : presetEquation;
  const activeEquation = liveEquation || baseEquation;
  const parsed = parseEquation(activeEquation);
  const trapHint = detectTrap(parsed);
  const availableMoves = getAvailableMoves(parsed);
  const suggestedMove = availableMoves[0] || "Simplify";
  const previewStep = buildPreviewStep(parsed, selectedMove || suggestedMove);
  const solved = solveEquation(activeEquation);
  const solution = solved?.solution;
  const totalProblems = levels.reduce((sum, lvl) => sum + lvl.problems.length, 0);
  const progress = Math.round((solvedCount / totalProblems) * 100);
  const isCorrect = activeEquation && solution !== null && guess !== "" && Number(guess) === solution;
  const missionComplete = parsed?.type === "linear" && parsed.coeff === 1 && parsed.constant === 0;

  function loadEquation(nextEquation) {
    setLiveEquation(nextEquation);
    setSelectedTrap("");
    setSelectedMove("");
    setAppliesToBothSides(null);
    setBalancedAnswer(null);
    setShowEscapePlan(false);
    setSubmitted(false);
    setGuess("");
    setHistory([]);
  }

  function resetMissionState(nextEquation = baseEquation) {
    setLiveEquation(nextEquation || "");
    setSelectedTrap("");
    setSelectedMove("");
    setAppliesToBothSides(null);
    setBalancedAnswer(null);
    setShowEscapePlan(false);
    setSubmitted(false);
    setGuess("");
    setHistory([]);
  }

  function startLevelMode() {
    setMode("level");
    setScreen("mission");
    setLevelIndex(0);
    setProblemIndex(0);
    setCustomEquation("");
    setTimeout(() => resetMissionState(levels[0].problems[0]), 0);
  }

  function startHomeworkMode() {
    setMode("homework");
    setScreen("mission");
    setTimeout(() => resetMissionState(customEquation.trim()), 0);
  }

  function handleSubmit() {
    setSubmitted(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      if (mode === "level") setSolvedCount((c) => c + 1);
    }
  }

  function applyMove() {
    if (!previewStep || appliesToBothSides !== true) return;
    setHistory((prev) => [...prev, previewStep]);
    setLiveEquation(previewStep.after);
    setSelectedTrap("");
    setSelectedMove("");
    setAppliesToBothSides(null);
    setBalancedAnswer(null);
    setSubmitted(false);
  }

  function handleNextMission() {
    if (mode === "homework") {
      resetMissionState(customEquation.trim());
      return;
    }

    const isLastInLevel = problemIndex === level.problems.length - 1;
    const isLastLevel = levelIndex === levels.length - 1;

    if (!isLastInLevel) {
      const nextIndex = problemIndex + 1;
      setProblemIndex(nextIndex);
      setTimeout(() => resetMissionState(level.problems[nextIndex]), 0);
      return;
    }

    if (!isLastLevel) {
      const nextLevel = levelIndex + 1;
      setLevelIndex(nextLevel);
      setProblemIndex(0);
      setTimeout(() => resetMissionState(levels[nextLevel].problems[0]), 0);
      return;
    }

    setLevelIndex(0);
    setProblemIndex(0);
    setTimeout(() => resetMissionState(levels[0].problems[0]), 0);
  }

  function handleResetAll() {
    setScreen("home");
    setMode("level");
    setLevelIndex(0);
    setProblemIndex(0);
    setCustomEquation("");
    setSolvedCount(0);
    setScore(0);
    setLiveEquation("");
    setHistory([]);
    setGuess("");
    setSelectedTrap("");
    setSelectedMove("");
    setAppliesToBothSides(null);
    setBalancedAnswer(null);
    setShowEscapePlan(false);
    setSubmitted(false);
  }

  return (
    <div className="w-full flex flex-col items-center">
      <img src="/walter-white-homework.jpg" alt="Do we have any homework" className="w-64 rounded-xl mb-4 shadow-lg" />
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="rounded-full px-3 py-1 text-sm bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">
                  Breaking Bad Algebra
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-sm border-white/20 text-white">
                  Break X out of the equation
                </Badge>
              </div>
              <div className="flex justify-center">
                <img
                  src="/walter-white-homework.jpg"
                  alt="Walter White asking about homework"
                  className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl"
                />
              </div>
              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                <div>
                  <CardTitle className="text-3xl md:text-5xl font-bold leading-tight">Breaking Bad Algebra</CardTitle>
                  <CardDescription className="text-zinc-300 text-base md:text-lg mt-3 max-w-3xl">
                    X is your friend. X is trapped inside an equation. Your mission is to keep the equation balanced,
                    choose the right move, and break X out step by step.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl p-4 bg-black/30 border border-white/10">
                    <div className="text-zinc-400">Solved</div>
                    <div className="text-2xl font-bold">{solvedCount}</div>
                  </div>
                  <div className="rounded-2xl p-4 bg-black/30 border border-white/10">
                    <div className="text-zinc-400">Score</div>
                    <div className="text-2xl font-bold">{score}</div>
                  </div>
                  <div className="col-span-2 rounded-2xl p-4 bg-black/30 border border-white/10">
                    <div className="flex justify-between text-sm text-zinc-300 mb-2">
                      <span>Mission progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {screen === "home" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-300 font-semibold"><Target size={18} /> How the game works</div>
                <CardTitle className="text-2xl">Free X Engine</CardTitle>
                <CardDescription className="text-zinc-300">Learn the moves that break X out of the equation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10"><div className="font-semibold text-emerald-200">1. Balance first</div><p className="text-zinc-300 mt-1">Whatever you do to one side, you must do to the other.</p></div>
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10"><div className="font-semibold text-emerald-200">2. Find the trap</div><p className="text-zinc-300 mt-1">Work out how X is trapped.</p></div>
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10"><div className="font-semibold text-emerald-200">3. Choose the move</div><p className="text-zinc-300 mt-1">Only relevant moves unlock.</p></div>
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10"><div className="font-semibold text-emerald-200">4. Observe and repeat</div><p className="text-zinc-300 mt-1">Each move updates the equation and unlocks the next set of moves.</p></div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-300 font-semibold"><WandSparkles size={18} /> Choose your mode</div>
                <CardTitle className="text-2xl">Start a mission</CardTitle>
                <CardDescription className="text-zinc-300">Practice with built-in levels or bring in a homework equation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button onClick={startLevelMode} className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-base"><Swords className="mr-2 h-4 w-4" /> Start level mode</Button>
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10 grid gap-3">
                  <div className="font-medium text-white">Homework mode</div>
                  <Input value={customEquation} onChange={(e) => setCustomEquation(e.target.value)} placeholder="Type an equation, e.g. 3x + 5 = 20" className="rounded-2xl h-12 bg-black/30 border-white/10 text-white placeholder:text-zinc-500" />
                  <Button onClick={startHomeworkMode} variant="outline" className="h-12 rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10"><Home className="mr-2 h-4 w-4" /> Use my homework equation</Button>
                  <p className="text-xs text-zinc-400">Starter version supports simple linear and bracket equations.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-6">
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Mission controls</CardTitle>
                <CardDescription className="text-zinc-300">Guide the moves that break X out of the equation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold"><ShieldAlert size={18} /> Balance first</div>
                  <p className="text-sm text-zinc-300 mt-2">Every move must happen on both sides.</p>
                </div>
                <div className="rounded-2xl p-4 bg-black/30 border border-white/10">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold"><Lock size={18} /> Trap detector</div>
                  <p className="text-sm text-zinc-300 mt-2">Detected trap: <span className="text-emerald-200">{trapHint}</span></p>
                  <p className="text-sm text-zinc-300 mt-1">Unlocked moves change after every step.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableMoves.map((move) => (
                      <span key={move} className="rounded-full px-3 py-1 text-xs bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">{move}</span>
                    ))}
                  </div>
                </div>
                {mode === "level" && (
                  <div className="rounded-2xl p-4 bg-black/30 border border-white/10 space-y-3">
                    <div className="font-medium text-white">Levels</div>
                    {levels.map((item, idx) => (
                      <button key={item.id} onClick={() => { setLevelIndex(idx); setProblemIndex(0); loadEquation(item.problems[0]); }} className={`w-full text-left rounded-2xl p-4 border transition ${idx === levelIndex ? "bg-emerald-500/20 border-emerald-300/40" : "bg-black/30 border-white/10 hover:bg-white/10"}`}>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-zinc-300 mt-1">{item.tagline}</div>
                      </button>
                    ))}
                  </div>
                )}
                {mode === "homework" && (
                  <div className="rounded-2xl p-4 bg-black/30 border border-white/10 grid gap-3">
                    <div className="font-medium text-white">Homework equation</div>
                    <Input value={customEquation} onChange={(e) => setCustomEquation(e.target.value)} placeholder="Type an equation" className="rounded-2xl h-12 bg-black/30 border-white/10 text-white placeholder:text-zinc-500" />
                    <Button variant="outline" onClick={() => loadEquation(customEquation.trim())} className="rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10">Load equation</Button>
                  </div>
                )}
                <Button onClick={handleResetAll} variant="outline" className="w-full rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10"><RefreshCw className="mr-2 h-4 w-4" /> Reset app</Button>
              </CardContent>
            </Card>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur shadow-2xl">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <Badge className="rounded-full bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">{mode === "level" ? level.title : "Homework mode"}</Badge>
                    {mode === "level" && <Badge variant="outline" className="rounded-full border-white/20 text-white">Problem {problemIndex + 1} of {level.problems.length}</Badge>}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">Current mission</CardTitle>
                  <CardDescription className="text-zinc-300">Break X out of the equation using guided moves.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-3xl bg-black/40 border border-emerald-400/20 p-6 md:p-8 text-center shadow-inner">
                    <div className="text-zinc-400 uppercase tracking-[0.2em] text-xs mb-3">Equation file</div>
                    <div className="text-3xl md:text-5xl font-bold text-emerald-200">{activeEquation || "Type an equation to start"}</div>
                  </div>

                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 md:p-5">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Step 1 — First Principle</div>
                      <div className="text-lg font-semibold text-white">The equation must stay balanced.</div>
                      <p className="text-sm text-zinc-300 mt-1">How is X trapped?</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {trapOptions.map((option) => (
                        <Button key={option} type="button" variant="outline" onClick={() => setSelectedTrap(option)} className={`justify-start rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${selectedTrap === option ? "ring-2 ring-emerald-400" : ""}`}>
                          {option}
                        </Button>
                      ))}
                    </div>
                    {selectedTrap && <p className="text-sm text-zinc-300">You chose: <span className="text-emerald-200">{selectedTrap}</span></p>}

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Step 2 — Inquiry</div>
                      <p className="text-sm text-zinc-300 mb-3">What move makes sense here?</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {allMoveOptions.map((option) => {
                        const unlocked = availableMoves.includes(option);
                        return (
                          <Button
                            key={option}
                            type="button"
                            variant="outline"
                            disabled={!unlocked}
                            onClick={() => unlocked && setSelectedMove(option)}
                            className={`justify-start rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${selectedMove === option ? "ring-2 ring-emerald-400" : ""} ${!unlocked ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            {option} {unlocked ? "✅" : "🔒"}
                          </Button>
                        );
                      })}
                    </div>
                    {selectedMove && <p className="text-sm text-zinc-300">You chose: <span className="text-emerald-200">{selectedMove}</span></p>}
                    {availableMoves.length > 0 && <p className="text-xs text-zinc-400">Only the moves that fit this exact stage of the equation are unlocked.</p>}

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="font-medium text-white">Apply to both sides?</div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <Button type="button" variant="outline" onClick={() => setAppliesToBothSides(true)} className={`rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${appliesToBothSides === true ? "ring-2 ring-emerald-400" : ""}`}>✅ Yes</Button>
                        <Button type="button" variant="outline" onClick={() => setAppliesToBothSides(false)} className={`rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${appliesToBothSides === false ? "ring-2 ring-red-400" : ""}`}>❌ No</Button>
                      </div>
                      {appliesToBothSides === false && <p className="text-sm text-amber-200 mt-3">Teachable moment: the move must happen on both sides to keep the equation balanced.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl p-5 bg-black/30 border border-white/10">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Step 3 — Observation</div>
                    <div className="text-white text-lg font-medium">What changes after the move?</div>
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-zinc-950/70 p-4 text-center">
                      <div className="text-xl md:text-2xl font-semibold text-emerald-200">{previewStep?.before || activeEquation || "Equation"}</div>
                      <div className="text-sm text-zinc-400 my-2">↓ {previewStep?.action || "Choose an unlocked move to preview the next step"}</div>
                      <div className="text-xl md:text-2xl font-semibold text-emerald-200">{previewStep?.after || "Next balanced equation appears here"}</div>
                    </div>
                    <div className="mt-4">
                      <div className="font-medium text-white">Is the equation still balanced?</div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <Button type="button" variant="outline" onClick={() => setBalancedAnswer(true)} className={`rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${balancedAnswer === true ? "ring-2 ring-emerald-400" : ""}`}>✅ Yes</Button>
                        <Button type="button" variant="outline" onClick={() => setBalancedAnswer(false)} className={`rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 ${balancedAnswer === false ? "ring-2 ring-red-400" : ""}`}>❌ No</Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={applyMove} disabled={!previewStep || appliesToBothSides !== true || balancedAnswer !== true} className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Apply move</Button>
                      <Button onClick={() => setShowEscapePlan((s) => !s)} variant="outline" className="rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10">{showEscapePlan ? "Hide escape plan" : "Show escape plan"}</Button>
                    </div>
                  </div>

                  {missionComplete && (
                    <div className="rounded-2xl p-4 border bg-emerald-500/10 border-emerald-400/30">
                      <div className="font-semibold text-emerald-200">Mission complete.</div>
                      <p className="text-sm text-zinc-200 mt-1">X is free. The next set of moves is no moves at all — because X is already out.</p>
                    </div>
                  )}

                  {history.length > 0 && (
                    <div className="rounded-2xl p-5 bg-black/30 border border-white/10">
                      <div className="font-semibold text-lg mb-3">Move history</div>
                      <ol className="space-y-2 text-sm text-zinc-200 list-decimal list-inside">
                        {history.map((step, idx) => (
                          <li key={idx}>{step.before} → {step.action} → {step.after}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center">
                    <Input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Enter the value of x when X is free" className="rounded-2xl h-12 bg-black/30 border-white/10 text-white placeholder:text-zinc-500" />
                    <Button onClick={handleSubmit} className="rounded-2xl h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Check mission</Button>
                  </div>

                  {submitted && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-4 border ${isCorrect ? "bg-emerald-500/15 border-emerald-400/30" : "bg-red-500/10 border-red-400/30"}`}>
                      {isCorrect ? (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="text-emerald-300 mt-0.5" />
                          <div>
                            <div className="font-semibold text-emerald-200">Correct.</div>
                            <p className="text-zinc-200 text-sm mt-1">You broke X out of the equation.</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-red-200">Not quite yet.</div>
                          <p className="text-zinc-200 text-sm mt-1">Keep following the unlocked moves until X is isolated.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {showEscapePlan && (
                    <div className="rounded-2xl p-5 bg-black/30 border border-white/10">
                      <div className="font-semibold text-lg mb-3">Escape plan</div>
                      {solved?.steps?.length ? (
                        <ol className="space-y-2 text-sm text-zinc-200 list-decimal list-inside">
                          {solved.steps.map((step, idx) => (
                            <li key={idx}>{step.before} → {step.action} → {step.after}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-zinc-300">Enter a supported equation to generate guided steps.</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleNextMission} variant="outline" className="rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10">{mode === "level" ? "Next mission" : "Reset mission"}</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
        </div>
  );
}
