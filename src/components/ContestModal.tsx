import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Share2, Sparkles, CheckCircle2, X, ExternalLink, Flame, Award, Heart, Copy, Check } from 'lucide-react';
import { CosmicLogo } from './CosmicLogo';

interface ContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectTitle?: string;
}

interface ContestEntry {
  id: string;
  creatorName: string;
  projectTitle: string;
  category: string;
  votes: number;
  timeAgo: string;
}

const INITIAL_ENTRIES: ContestEntry[] = [
  {
    id: 'entry-1',
    creatorName: 'Alex Rivera',
    projectTitle: 'Cultural Genius Quiz Quest',
    category: 'Educational Game',
    votes: 142,
    timeAgo: '2h ago',
  },
  {
    id: 'entry-2',
    creatorName: 'Sarah Lin',
    projectTitle: 'Solar System Planetary Orbit Explorer',
    category: 'Science App',
    votes: 118,
    timeAgo: '5h ago',
  },
  {
    id: 'entry-3',
    creatorName: 'Tariq Mansoor',
    projectTitle: 'Arabic Calligraphy & Word Scramble',
    category: 'Language Game',
    votes: 95,
    timeAgo: '1d ago',
  },
  {
    id: 'entry-4',
    creatorName: 'Elena Rostova',
    projectTitle: 'Mental Math & Logic Brain Gym',
    category: 'Math Game',
    votes: 84,
    timeAgo: '1d ago',
  }
];

export const ContestModal: React.FC<ContestModalProps> = ({
  isOpen,
  onClose,
  activeProjectTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [entries, setEntries] = useState<ContestEntry[]>(INITIAL_ENTRIES);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectTitle: activeProjectTitle || '',
    socialLink: '',
  });

  useEffect(() => {
    if (activeProjectTitle && !formData.projectTitle) {
      setFormData(prev => ({ ...prev, projectTitle: activeProjectTitle }));
    }
  }, [activeProjectTitle]);

  if (!isOpen) return null;

  const shareText = encodeURIComponent(
    `I just built an interactive educational app with GameForge AI! Check it out and support my entry in the Creator Challenge: ${window.location.origin} #GameForgeAI #CosmicBuilder`
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=contest`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = (id: string) => {
    if (votedIds.has(id)) return;
    setVotedIds(prev => new Set(prev).add(id));
    setEntries(prev =>
      prev.map(item => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    );
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.projectTitle.trim()) return;

    const newEntry: ContestEntry = {
      id: `entry-${Date.now()}`,
      creatorName: formData.name.trim(),
      projectTitle: formData.projectTitle.trim(),
      category: 'Community Project',
      votes: 1,
      timeAgo: 'Just now',
    };

    setEntries(prev => [newEntry, ...prev]);
    setVotedIds(prev => new Set(prev).add(newEntry.id));
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#130b29] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/70 overflow-hidden text-left my-auto">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-purple-500/30 via-fuchsia-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-purple-500/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Creator Contest: Build, Share &amp; Win
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Build the best educational game or app, share your link, and win cash &amp; cloud rewards!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto scrollbar-thin">
          {/* Prize Banner */}
          <div className="bg-gradient-to-r from-purple-900/60 via-[#27144d] to-indigo-900/60 border border-purple-400/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                <Gift className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Grand Winner Prize
                </div>
                <div className="text-lg font-black text-white">
                  Creator Spotlight Award + 1-Year Pro Cloud Tier
                </div>
                <p className="text-xs text-purple-200/70">
                  Featured placement on the platform showcase and social spotlight!
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0 bg-purple-950/60 px-4 py-2 rounded-xl border border-purple-500/20">
              <div className="text-[10px] text-purple-300 uppercase font-semibold">Ends In</div>
              <div className="text-base font-black text-white font-mono">14 Days</div>
            </div>
          </div>

          {/* 3 Step Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1b103b]/80 border border-purple-500/20 rounded-2xl p-3.5 flex flex-col">
              <div className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-300 text-xs font-black flex items-center justify-center mb-2">
                1
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Build Your Project</h4>
              <p className="text-[11px] text-purple-300/70 leading-relaxed">
                Use AI to generate a creative educational game, web app, or modern interactive tool.
              </p>
            </div>

            <div className="bg-[#1b103b]/80 border border-purple-500/20 rounded-2xl p-3.5 flex flex-col">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-black flex items-center justify-center mb-2">
                2
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Share Publicly</h4>
              <p className="text-[11px] text-purple-300/70 leading-relaxed">
                Post your creation on X, LinkedIn, or Discord with tag <strong className="text-purple-200">#GameForgeAI</strong>.
              </p>
            </div>

            <div className="bg-[#1b103b]/80 border border-purple-500/20 rounded-2xl p-3.5 flex flex-col">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-300 text-xs font-black flex items-center justify-center mb-2">
                3
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Gather Votes &amp; Win</h4>
              <p className="text-[11px] text-purple-300/70 leading-relaxed">
                Submit below to enter the live leaderboard and collect community upvotes.
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="bg-[#180e36] border border-purple-500/20 rounded-2xl p-4">
            <div className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Share Platform &amp; Invite Voters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#1da1f2]/20 hover:bg-[#1da1f2]/30 border border-[#1da1f2]/40 text-[#1da1f2] text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <span>Share on X (Twitter)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#25d366]/20 hover:bg-[#25d366]/30 border border-[#25d366]/40 text-[#25d366] text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <span>Share on WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#0077b5]/20 hover:bg-[#0077b5]/30 border border-[#0077b5]/40 text-[#0077b5] text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <span>Share on LinkedIn</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Contest Link'}</span>
              </button>
            </div>
          </div>

          {/* Submission Form or Confirmation */}
          {submitted ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Your entry has been registered!
              </h3>
              <p className="text-xs text-emerald-300/80 max-w-md mx-auto mb-3">
                Your project is now listed in the contest leaderboard. Share your link with friends to gather more votes!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-purple-300 hover:text-white underline cursor-pointer"
              >
                Submit another project
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitEntry} className="bg-[#180e36] border border-purple-500/20 rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Submit Your Project to the Contest</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300/80 mb-1">Your Name / Handle</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Alex Johnson"
                    className="w-full bg-[#120a2a] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300/80 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full bg-[#120a2a] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300/80 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.projectTitle}
                    onChange={e => setFormData({ ...formData, projectTitle: e.target.value })}
                    placeholder="e.g., Cultural Genius Quiz Quest"
                    className="w-full bg-[#120a2a] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300/80 mb-1">Post / Social Share URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.socialLink}
                    onChange={e => setFormData({ ...formData, socialLink: e.target.value })}
                    placeholder="https://twitter.com/... or https://linkedin.com/..."
                    className="w-full bg-[#120a2a] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-900/40 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enter Contest &amp; Register on Leaderboard</span>
              </button>
            </form>
          )}

          {/* Live Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Current Leaderboard</span>
              </div>
              <span className="text-[10px] text-purple-300/60">Updated in real-time</span>
            </div>

            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const isTop3 = idx < 3;
                const hasVoted = votedIds.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isTop3
                        ? 'bg-gradient-to-r from-purple-950/70 to-[#1e103f] border-purple-500/30'
                        : 'bg-[#150c30] border-purple-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {entry.projectTitle}
                        </div>
                        <div className="text-[10px] text-purple-300/70 flex items-center gap-2">
                          <span>by {entry.creatorName}</span>
                          <span>•</span>
                          <span className="text-purple-400">{entry.category}</span>
                          <span>•</span>
                          <span>{entry.timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(entry.id)}
                      disabled={hasVoted}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                        hasVoted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 active:scale-95'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-emerald-400 text-emerald-400' : 'text-purple-300'}`} />
                      <span>{entry.votes}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
