import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

interface CreatedMap {
  id: string;
  mapName: string;
  password: string;
  selectedGame: 'questions' | 'braAlsalfa' | 'mafia';
  creatorName: string;
  playersCount: number;
  playersList: string[];
  createdAt: number;
}

interface TransferRecord {
  id: string;
  senderName: string;
  amount: number;
  password: string;
  createdAt: number;
}

interface VoiceMessage {
  id: string;
  sender: string;
  audioBase64: string;
  timestamp: number;
}

// Global in-memory storage synced across all players and phones connecting to this backend
let activeMaps: CreatedMap[] = [];
let pendingTransfers: TransferRecord[] = [];
const mapVoiceMessages: Record<string, VoiceMessage[]> = {};
let publishedCustomGames: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Helper to sanitize maps (NEVER leak password to other phones/clients)
  const getSanitizedMaps = () =>
    activeMaps.map(({ password: _pw, ...rest }) => rest);

  // === ONLINE MAPS API ===
  app.get("/api/maps", (req, res) => {
    res.json({ maps: getSanitizedMaps() });
  });

  app.post("/api/maps/create", (req, res) => {
    const { mapName, password, selectedGame, creatorName } = req.body;
    if (!mapName || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check duplicate
    const exists = activeMaps.some(
      (m) => m.mapName.toLowerCase() === mapName.trim().toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "اسم الماب مستخدم مسبقاً!" });
    }

    const newMap: CreatedMap = {
      id: Date.now().toString(),
      mapName: mapName.trim(),
      password: password.trim(),
      selectedGame: selectedGame || 'questions',
      creatorName: creatorName || 'المنشئ (أنت)',
      playersCount: 1,
      playersList: [creatorName || 'المنشئ (أنت)'],
      createdAt: Date.now(),
    };

    activeMaps.unshift(newMap);
    // Keep max 50 recent maps
    if (activeMaps.length > 50) {
      activeMaps = activeMaps.slice(0, 50);
    }

    res.json({ success: true, map: newMap, maps: getSanitizedMaps() });
  });

  app.post("/api/maps/join", (req, res) => {
    const { mapId, password, playerName } = req.body;
    const map = activeMaps.find((m) => m.id === mapId);
    if (!map) {
      return res.status(404).json({ error: "الماب غير موجود أو تم حذفه!" });
    }

    if (map.password.trim() !== String(password || "").trim()) {
      return res.status(403).json({ error: "الباسورد غلط! كلمة المرور غير صحيحة" });
    }

    if (map.playersCount >= 16) {
      return res.status(400).json({ error: "الماب ممتلئ بالكامل (16/16 لاعبين)!" });
    }

    const joiningPlayer = playerName || `لاعب ${map.playersCount + 1}`;
    if (!map.playersList.includes(joiningPlayer)) {
      map.playersList.push(joiningPlayer);
      map.playersCount = map.playersList.length;
    }

    res.json({ success: true, map, maps: getSanitizedMaps() });
  });

  app.delete("/api/maps/:id", (req, res) => {
    const { id } = req.params;
    activeMaps = activeMaps.filter((m) => m.id !== id);
    delete mapVoiceMessages[id];
    res.json({ success: true, maps: getSanitizedMaps() });
  });

  // === VOICE CHAT REALTIME BROADCAST API ===
  app.post("/api/maps/:id/voice", (req, res) => {
    const { id } = req.params;
    const { sender, audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "لا توجد بيانات صوتية" });
    }

    if (!mapVoiceMessages[id]) {
      mapVoiceMessages[id] = [];
    }

    const now = Date.now();
    const voiceMsg: VoiceMessage = {
      id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
      sender: sender || "لاعب",
      audioBase64,
      timestamp: now,
    };

    mapVoiceMessages[id].push(voiceMsg);
    // Keep within last 40 clips and younger than 40 seconds
    mapVoiceMessages[id] = mapVoiceMessages[id]
      .filter((m) => now - m.timestamp < 40000)
      .slice(-40);

    res.json({ success: true, messageId: voiceMsg.id });
  });

  app.get("/api/maps/:id/voice", (req, res) => {
    const { id } = req.params;
    const since = Number(req.query.since) || 0;
    const messages = (mapVoiceMessages[id] || []).filter((m) => m.timestamp > since);
    res.json({ messages });
  });

  // === TRANSFERS API ===
  app.get("/api/transfers", (req, res) => {
    const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
    pendingTransfers = pendingTransfers.filter((t) => Date.now() - t.createdAt < TEN_DAYS);
    res.json({
      transfers: pendingTransfers.map(({ password: _pw, ...rest }) => rest),
    });
  });

  app.post("/api/transfers/send", (req, res) => {
    const { senderName, amount, password } = req.body;
    if (!senderName || !amount || !password) {
      return res.status(400).json({ error: "بيانات التحويل غير مكتملة" });
    }

    const duplicate = pendingTransfers.some(
      (t) => t.senderName.toLowerCase() === senderName.trim().toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ error: "هذا الاسم مستخدم مسبقاً في عملية تحويل أخرى!" });
    }

    const newTransfer: TransferRecord = {
      id: Date.now().toString(),
      senderName: senderName.trim(),
      amount: Number(amount),
      password: password.trim(),
      createdAt: Date.now(),
    };

    pendingTransfers.unshift(newTransfer);
    res.json({
      success: true,
      transfer: {
        id: newTransfer.id,
        senderName: newTransfer.senderName,
        amount: newTransfer.amount,
        createdAt: newTransfer.createdAt,
      },
      transfers: pendingTransfers.map(({ password: _pw, ...rest }) => rest),
    });
  });

  app.post("/api/transfers/claim", (req, res) => {
    const { transferId, password } = req.body;
    const index = pendingTransfers.findIndex((t) => t.id === transferId);
    if (index === -1) {
      return res.status(404).json({ error: "التحويل غير متوفر أو تم استلامه مسبقاً!" });
    }

    const transfer = pendingTransfers[index];
    if (transfer.password.trim() !== String(password || "").trim()) {
      return res.status(403).json({
        error: "هذا المال ليس لك، انت غير مسموح ان تستخدمه، اكتب الباسورد صح وسوف تستخدمه",
      });
    }

    // Remove claimed transfer
    pendingTransfers.splice(index, 1);
    res.json({
      success: true,
      amount: transfer.amount,
      senderName: transfer.senderName,
      transfers: pendingTransfers.map(({ password: _pw, ...rest }) => rest),
    });
  });

  // === INTERNAL BACKGROUND APP-ONLY SYNC HUB (خاص فقط بالتطبيق وخلف الكواليس) ===
  app.get("/api/internal/app-sync", (req, res) => {
    const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
    pendingTransfers = pendingTransfers.filter((t) => Date.now() - t.createdAt < TEN_DAYS);
    // Only app internals access this endpoint behind the scenes
    res.json({
      success: true,
      transfersList: pendingTransfers.map((t) => ({
        id: t.id,
        senderName: t.senderName,
        amount: t.amount,
        createdAt: t.createdAt,
      })),
      mapsList: activeMaps.map((m) => ({
        id: m.id,
        mapName: m.mapName,
        selectedGame: m.selectedGame,
        creatorName: m.creatorName,
        playersCount: m.playersCount,
        playersList: m.playersList,
        createdAt: m.createdAt,
      })),
    });
  });

  // Background password verification for claiming money transfer
  app.post("/api/internal/claim-transfer", (req, res) => {
    const { transferId, password } = req.body;
    const transfer = pendingTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      return res.status(404).json({ error: "التحويل غير متوفر أو تم استلامه مسبقاً!" });
    }

    if (transfer.password.trim() !== String(password || "").trim()) {
      return res.status(403).json({
        error: "هذا المال ليس لك، انت غير مسموح ان تستخدمه، اكتب الباسورد صح وسوف تستخدمه",
      });
    }

    // Success: Remove transfer and return funds to claimant
    pendingTransfers = pendingTransfers.filter((t) => t.id !== transferId);
    res.json({
      success: true,
      amount: transfer.amount,
      senderName: transfer.senderName,
      message: `تم استلام ${transfer.amount} ليرة بنجاح!`,
    });
  });

  // Background password verification for joining online map
  app.post("/api/internal/join-map", (req, res) => {
    const { mapId, password, playerName } = req.body;
    const map = activeMaps.find((m) => m.id === mapId);
    if (!map) {
      return res.status(404).json({ error: "الماب غير موجود أو تم حذفه!" });
    }

    if (map.password.trim() !== String(password || "").trim()) {
      return res.status(403).json({ error: "الباسورد غلط! كلمة المرور غير صحيحة" });
    }

    if (map.playersCount >= 16) {
      return res.status(400).json({ error: "الماب ممتلئ بالكامل (16/16 لاعبين)!" });
    }

    const joiningPlayer = playerName || `لاعب ${map.playersCount + 1}`;
    if (!map.playersList.includes(joiningPlayer)) {
      map.playersList.push(joiningPlayer);
      map.playersCount = map.playersList.length;
    }

    res.json({ success: true, map, maps: getSanitizedMaps() });
  });

  // === REAL PUBLISHED CUSTOM GAMES API (100% real only, NO fake games) ===
  app.get("/api/custom-games", (req, res) => {
    // Sorting rule specified:
    // 1. Most likes first
    // 2. If tied: first to publish (earliest createdAt) is first
    // 3. If exact same timestamp: random
    const sorted = [...publishedCustomGames].sort((a, b) => {
      const likesA = Number(a.likes) || 0;
      const likesB = Number(b.likes) || 0;
      if (likesB !== likesA) {
        return likesB - likesA;
      }
      const createdA = Number(a.createdAt) || 0;
      const createdB = Number(b.createdAt) || 0;
      if (createdA !== createdB) {
        return createdA - createdB;
      }
      return Math.random() - 0.5;
    });
    res.json(sorted);
  });

  app.post("/api/custom-games", (req, res) => {
    const { id, name, description, tax, imageUrl, url, creatorName } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newGame = {
      id: id || Date.now().toString(),
      name: String(name).trim(),
      description: description || "",
      tax: Number(tax) || 20,
      imageUrl: imageUrl || "",
      url: String(url).trim(),
      creatorName: creatorName || "مستخدم",
      likes: 0,
      shares: 0,
      directTips: 0,
      comments: [],
      playsCount: 0,
      earningsTotal: 0,
      claimedEarnings: 0,
      allowComments: true, // Enabled by default
      createdAt: Date.now(),
    };
    publishedCustomGames.unshift(newGame);
    res.json({ success: true, game: newGame, games: publishedCustomGames });
  });

  // Toggle or update game settings (like allowComments)
  app.patch("/api/custom-games/:id/settings", (req, res) => {
    const { id } = req.params;
    const { allowComments } = req.body || {};
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (typeof allowComments === "boolean") {
      game.allowComments = allowComments;
    }
    res.json({ success: true, allowComments: game.allowComments ?? true, game });
  });

  // Like or unlike endpoint
  app.post("/api/custom-games/:id/like", (req, res) => {
    const { id } = req.params;
    const { delta } = req.body || {};
    const game = publishedCustomGames.find((g) => g.id === id);
    if (game) {
      const change = typeof delta === "number" ? delta : 1;
      game.likes = Math.max(0, (Number(game.likes) || 0) + change);
      return res.json({ success: true, likes: game.likes, game });
    }
    res.status(404).json({ error: "Game not found" });
  });

  // Add real comment
  app.post("/api/custom-games/:id/comments", (req, res) => {
    const { id } = req.params;
    const { author, text, tipLiras, tipJewels } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    // Check if comments are restricted (allowComments === false)
    if (game.allowComments === false) {
      const tipL = Math.max(0, Number(tipLiras) || 0);
      const tipJ = Math.max(0, Number(tipJewels) || 0);
      if (tipL <= 0 && tipJ <= 0) {
        return res.status(403).json({
          error: "التعليقات العادية مغلقة لهذه اللعبة! يُسمح فقط بإرسال تعليقات الهدايا (ليرات أو مجوهرات).",
        });
      }
    }
    if (!Array.isArray(game.comments)) {
      game.comments = [];
    }
    const comment = {
      id: "comment_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      author: String(author || "لاعب").trim() || "لاعب",
      text: String(text).trim(),
      likes: 0,
      tipLiras: Math.max(0, Number(tipLiras) || 0),
      tipJewels: Math.max(0, Number(tipJewels) || 0),
      replies: [],
      createdAt: Date.now(),
    };
    if (comment.tipLiras > 0) {
      game.directTips = (Number(game.directTips) || 0) + comment.tipLiras;
      game.earningsTotal = (Number(game.earningsTotal) || 0) + comment.tipLiras;
    }
    game.comments.push(comment);
    res.json({ success: true, comment, comments: game.comments, game });
  });

  // Like a specific comment
  app.post("/api/custom-games/:id/comments/:commentId/like", (req, res) => {
    const { id, commentId } = req.params;
    const { delta } = req.body || {};
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!Array.isArray(game.comments)) game.comments = [];
    const comment = game.comments.find((c: any) => c.id === commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const change = typeof delta === "number" ? delta : 1;
    comment.likes = Math.max(0, (Number(comment.likes) || 0) + change);
    res.json({ success: true, likes: comment.likes, comment, comments: game.comments });
  });

  // Reply to a specific comment
  app.post("/api/custom-games/:id/comments/:commentId/reply", (req, res) => {
    const { id, commentId } = req.params;
    const { author, text } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Reply cannot be empty" });
    }
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!Array.isArray(game.comments)) game.comments = [];
    const comment = game.comments.find((c: any) => c.id === commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!Array.isArray(comment.replies)) comment.replies = [];

    const reply = {
      id: "reply_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      author: String(author || "لاعب").trim() || "لاعب",
      text: String(text).trim(),
      replyToCommentId: commentId,
      replyToAuthor: comment.author,
      createdAt: Date.now(),
    };
    comment.replies.push(reply);
    res.json({ success: true, reply, comment, comments: game.comments });
  });

  // Delete a specific comment permanently
  app.delete("/api/custom-games/:id/comments/:commentId", (req, res) => {
    const { id, commentId } = req.params;
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!Array.isArray(game.comments)) game.comments = [];
    game.comments = game.comments.filter((c: any) => c.id !== commentId);
    res.json({ success: true, comments: game.comments, game });
  });

  // Add tip liras to boost an existing comment (Heart with dollar)
  app.post("/api/custom-games/:id/comments/:commentId/tip", (req, res) => {
    const { id, commentId } = req.params;
    const { amount } = req.body || {};
    const tipAmount = Math.max(0, Number(amount) || 0);
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!Array.isArray(game.comments)) game.comments = [];
    const comment = game.comments.find((c: any) => c.id === commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    comment.tipLiras = (Number(comment.tipLiras) || 0) + tipAmount;
    if (tipAmount > 0) {
      game.directTips = (Number(game.directTips) || 0) + tipAmount;
      game.earningsTotal = (Number(game.earningsTotal) || 0) + tipAmount;
    }
    res.json({ success: true, tipLiras: comment.tipLiras, comment, comments: game.comments, game });
  });

  // Record share & update shares count (each share earns 150 liras!)
  app.post("/api/custom-games/:id/share", (req, res) => {
    const { id } = req.params;
    const game = publishedCustomGames.find((g) => g.id === id);
    if (game) {
      game.shares = (Number(game.shares) || 0) + 1;
      return res.json({ success: true, shares: game.shares, game });
    }
    res.status(404).json({ error: "Game not found" });
  });

  // Direct tip / send money to game creator (e.g. 500 liras sent to the creator of the game)
  app.post("/api/custom-games/:id/tip", (req, res) => {
    const { id } = req.params;
    const { amount, senderName } = req.body || {};
    const tipAmount = Math.max(0, Number(amount) || 0);
    const game = publishedCustomGames.find((g) => g.id === id);
    if (!game) return res.status(404).json({ error: "اللعبة غير موجودة" });

    game.directTips = (Number(game.directTips) || 0) + tipAmount;
    game.earningsTotal = (Number(game.earningsTotal) || 0) + tipAmount;
    res.json({
      success: true,
      amount: tipAmount,
      senderName: senderName || "لاعب",
      directTips: game.directTips,
      earningsTotal: game.earningsTotal,
      game,
    });
  });

  // Delete custom game permanently
  // "وبالاضافه الى شخص لديه لعبه كبس على كبسه حذف اللعبه بعد تاكيد اذ كبس نعم حذف يتم حذف هذه اللعبه كليا ولا يمكن العوده اليها ابدا ابدا ابدا"
  app.delete("/api/custom-games/:id", (req, res) => {
    const { id } = req.params;
    const prevCount = publishedCustomGames.length;
    publishedCustomGames = publishedCustomGames.filter((g) => String(g.id) !== String(id));
    return res.json({
      success: true,
      message: "تم حذف هذه اللعبة كلياً ونهائياً ولا يمكن العودة إليها أبداً",
      deletedCount: prevCount - publishedCustomGames.length,
      games: publishedCustomGames,
    });
  });

  // Delete all games created by user on logout:
  // "اذا الشخص صنع لعبه وبعد قليل سجل خروجه من اللعبه يتم حذف اللعبه الذي صنعها معها كليا"
  app.post("/api/custom-games/delete-user-games", (req, res) => {
    const { gameIds, creatorNames } = req.body || {};
    const idsSet = new Set(Array.isArray(gameIds) ? gameIds.map(String) : []);
    const namesSet = new Set(
      Array.isArray(creatorNames) ? creatorNames.map((n: string) => String(n).trim().toLowerCase()) : []
    );

    publishedCustomGames = publishedCustomGames.filter((g) => {
      if (idsSet.has(String(g.id))) return false;
      if (g.creatorName && namesSet.has(String(g.creatorName).trim().toLowerCase())) return false;
      return true;
    });

    res.json({ success: true, message: "تم حذف ألعاب المستخدم تلقائياً", games: publishedCustomGames });
  });

  // Record real play & update creator earnings (50% of tax goes to creator)
  app.post("/api/custom-games/:id/play", (req, res) => {
    const { id } = req.params;
    const game = publishedCustomGames.find((g) => g.id === id);
    if (game) {
      game.playsCount = (Number(game.playsCount) || 0) + 1;
      const creatorCut = Math.floor((Number(game.tax) || 20) * 0.5);
      game.earningsTotal = (Number(game.earningsTotal) || 0) + creatorCut;
      return res.json({
        success: true,
        playsCount: game.playsCount,
        earningsTotal: game.earningsTotal,
        game,
      });
    }
    res.status(404).json({ error: "Game not found" });
  });

  // Creator claims earnings
  app.post("/api/custom-games/:id/claim", (req, res) => {
    const { id } = req.params;
    const { amountToClaim } = req.body || {};
    const game = publishedCustomGames.find((g) => g.id === id);
    if (game) {
      if (typeof amountToClaim === "number" && amountToClaim > 0) {
        game.claimedEarnings = (Number(game.claimedEarnings) || 0) + amountToClaim;
      } else {
        game.claimedEarnings = Number(game.earningsTotal) || 0;
      }
      return res.json({ success: true, claimedEarnings: game.claimedEarnings, game });
    }
    res.status(404).json({ error: "Game not found" });
  });

  // === GEMINI AI - AUTOMATED RIDDLES & QUESTIONS GENERATOR ===
  // When a player finishes all questions/riddles, or requests new stages, Gemini API generates fresh, unique challenges
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'shtime-2-app',
      },
    },
  });

  app.post("/api/gemini/generate-riddles", async (req, res) => {
    try {
      const { startStage = 206, count = 10 } = req.body || {};
      const numToGenerate = Math.min(Math.max(1, Number(count) || 10), 20);

      const prompt = `You are a master puzzle creator for Shtime-2, an intellectually challenging IQ and riddles game.
Generate exactly ${numToGenerate} completely unique, high-IQ, creative riddles and questions starting at stage ${startStage}.
CRITICAL REQUIREMENTS:
1. Ensure none of the riddles repeat or resemble each other. Every single question must test a different domain (lateral thinking, math logic, science trivia, linguistic paradox, historical mystery).
2. Provide both Arabic and English versions for each riddle:
   - questionAr & questionEn
   - answerAr & answerEn
   - acceptedAnswersAr (array of strings) & acceptedAnswersEn (array of strings)
   - hintAr & hintEn
   - categoryIndex (number between 0 and 5: 0=Beginner, 1=Ascent, 2=Progress, 3=Advanced, 4=Elevation, 5=Challenging)
3. Return strictly valid JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionAr: { type: Type.STRING },
                questionEn: { type: Type.STRING },
                answerAr: { type: Type.STRING },
                answerEn: { type: Type.STRING },
                acceptedAnswersAr: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                acceptedAnswersEn: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                hintAr: { type: Type.STRING },
                hintEn: { type: Type.STRING },
                categoryIndex: { type: Type.INTEGER },
              },
              required: [
                "questionAr",
                "questionEn",
                "answerAr",
                "answerEn",
                "acceptedAnswersAr",
                "acceptedAnswersEn",
                "hintAr",
                "hintEn",
                "categoryIndex",
              ],
            },
          },
        },
      });

      const text = response.text?.trim() || "[]";
      const parsed = JSON.parse(text);
      return res.json({ success: true, riddles: parsed });
    } catch (err: any) {
      console.error("Gemini riddle generation error:", err);
      return res.status(500).json({ error: "Failed to generate riddles via Gemini", details: err?.message });
    }
  });

  // === NOTIFICATIONS BROADCAST API ===
  let latestBroadcastNotification: any = {
    title: 'Shtime-2.  الاعب الان 2026_2027',
    body: 'تحديث جديد 🆕 1 اللغه العربيه والانجليزيه 2 الذي ينتهي من كل الاسئله سوف يبدا الذكاء الاصطناعي بصناعه اسئله جديده لها',
    timestamp: Date.now(),
  };

  app.post("/api/notifications/broadcast", (req, res) => {
    const { title, body } = req.body || {};
    latestBroadcastNotification = {
      title: title || 'Shtime-2.  الاعب الان 2026_2027',
      body: body || 'تحديث جديد 🆕 1 اللغه العربيه والانجليزيه 2 الذي ينتهي من كل الاسئله سوف يبدا الذكاء الاصطناعي بصناعه اسئله جديده لها',
      timestamp: Date.now(),
    };
    return res.json({ success: true, notification: latestBroadcastNotification });
  });

  app.get("/api/notifications/active", (req, res) => {
    return res.json({ notification: latestBroadcastNotification });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: Date.now() });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
