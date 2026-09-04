"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const OPTIONS = [
  { id: "hummus", label: "Hummus", emoji: "🫘" },
  { id: "tabbouleh", label: "Tabbouleh", emoji: "🌿" },
  { id: "kibbeh", label: "Kibbeh", emoji: "🍖" },
  { id: "fattoush", label: "Fattoush", emoji: "🥗" },
  { id: "manakish", label: "Manakish", emoji: "🫓" },
  { id: "shawarma", label: "Shawarma", emoji: "🌯" },
  { id: "babaGhanoush", label: "Baba Ghanoush", emoji: "🍆" },
  { id: "falafel", label: "Falafel", emoji: "🧆" },
  { id: "mujadara", label: "Mujadara", emoji: "🍚" },
  { id: "knafeh", label: "Knafeh (dessert)", emoji: "🍰" },
];

const STORAGE_KEY = "lebaneseFoodPoll";

function emptyTally() {
  return OPTIONS.reduce((acc, o) => ({ ...acc, [o.id]: 0 }), {});
}

function loadMyVote() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { voteId: null, optionId: null };
    return JSON.parse(raw);
  } catch {
    return { voteId: null, optionId: null };
  }
}

function tallyRows(rows) {
  const tally = emptyTally();
  for (const row of rows) {
    if (tally[row.option_id] !== undefined) tally[row.option_id] += 1;
  }
  return tally;
}

export default function LebaneseFoodPoll() {
  const [votes, setVotes] = useState(emptyTally());
  const [votedFor, setVotedFor] = useState(null);
  const [voteId, setVoteId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const refetchTally = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("votes")
      .select("option_id");
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setVotes(tallyRows(data));
  }, []);

  useEffect(() => {
    const mine = loadMyVote();
    setVotedFor(mine.optionId);
    setVoteId(mine.voteId);

    refetchTally().finally(() => setLoading(false));

    const channel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => refetchTally()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchTally]);

  const handleVote = async () => {
    if (!selected || votedFor || submitting) return;
    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("votes")
      .insert({ option_id: selected })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ voteId: data.id, optionId: selected })
    );
    setVoteId(data.id);
    setVotedFor(selected);
    refetchTally();
  };

  const handleReset = async () => {
    if (!votedFor || submitting) return;
    setSubmitting(true);
    setError(null);

    if (voteId) {
      const { error: deleteError } = await supabase
        .from("votes")
        .delete()
        .eq("id", voteId);
      if (deleteError) {
        setSubmitting(false);
        setError(deleteError.message);
        return;
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setVoteId(null);
    setVotedFor(null);
    setSelected(null);
    setSubmitting(false);
    refetchTally();
  };

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

  const sortedResults = [...OPTIONS]
    .map((o) => ({ ...o, count: votes[o.id] }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...sortedResults.map((r) => r.count));

  return (
    <div className="min-h-screen bg-[#FBF3E3] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-[#FFFDF8] rounded-2xl shadow-lg border border-[#E7D9BD] overflow-hidden">
        <div className="bg-[#B5553A] px-6 py-5 sm:px-8 sm:py-6">
          <p className="text-[#F3D9C4] text-sm font-medium uppercase tracking-wide">
            Community Poll
          </p>
          <h1 className="text-[#FFFDF8] text-xl sm:text-2xl font-bold mt-1">
            What's your favourite Lebanese dish?
          </h1>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-[#8A7A5C]">Loading poll…</p>
          ) : !votedFor ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {OPTIONS.map((option) => {
                  const isSelected = selected === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelected(option.id)}
                      className={
                        "flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition " +
                        (isSelected
                          ? "border-[#6E7B3F] bg-[#EEF0DF] ring-2 ring-[#6E7B3F]"
                          : "border-[#E7D9BD] bg-white hover:border-[#B5553A]/50 hover:bg-[#FBF3E3]")
                      }
                    >
                      <span className="text-xl leading-none">{option.emoji}</span>
                      <span className="text-sm font-medium text-[#4A3B2A]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleVote}
                disabled={!selected || submitting}
                className={
                  "mt-6 w-full rounded-xl py-3 font-semibold transition " +
                  (selected && !submitting
                    ? "bg-[#6E7B3F] text-white hover:bg-[#5C6934]"
                    : "bg-[#E7D9BD] text-[#A99A7C] cursor-not-allowed")
                }
              >
                {submitting ? "Voting…" : "Vote"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-bold text-[#4A3B2A]">Results</h2>
                <span className="text-sm text-[#8A7A5C]">
                  {totalVotes} total vote{totalVotes === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-3">
                {sortedResults.map((result) => {
                  const pct = totalVotes
                    ? Math.round((result.count / totalVotes) * 100)
                    : 0;
                  const barWidth = Math.round((result.count / maxCount) * 100);
                  const isMine = result.id === votedFor;

                  return (
                    <div key={result.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-[#4A3B2A]">
                          <span>{result.emoji}</span>
                          {result.label}
                          {isMine && (
                            <span className="ml-1 text-[10px] uppercase tracking-wide bg-[#6E7B3F] text-white px-1.5 py-0.5 rounded-full">
                              your vote
                            </span>
                          )}
                        </span>
                        <span className="text-[#8A7A5C] tabular-nums">
                          {pct}% · {result.count}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#EFE6D2] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#B5553A] to-[#D97A57] transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="mt-6 w-full text-center text-sm text-[#8A7A5C] underline decoration-dotted hover:text-[#B5553A] disabled:opacity-50"
              >
                {submitting ? "Resetting…" : "Reset my vote (for testing)"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
