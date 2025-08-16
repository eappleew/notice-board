const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Steam API 키 (환경변수 또는 직접 설정)
const STEAM_API_KEY = process.env.STEAM_API_KEY || "62C597CD3CEC7C7AF3F2D60655C4A76B";

// CORS 설정
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

// Steam 데이터 가져오기 API
app.get('/api/steam-data/:steamId', async (req, res) => {
    try {
        const steamId = req.params.steamId;
        console.log(`Steam ID ${steamId} 데이터 요청`);
        
        // 실제 Steam API 호출
        const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
        
        console.log('실제 Steam API 호출:', steamApiUrl);
        
        const response = await fetch(steamApiUrl);
        const data = await response.json();
        
        console.log('Steam API 응답:', data);
        
        if (data.response && data.response.games) {
            const games = data.response.games.map(game => ({
                name: game.name || `Game ${game.appid}`,
                playtime: Math.round((game.playtime_forever / 60) * 10) / 10, // 분을 시간으로 변환
                playtime2weeks: Math.round((game.playtime_2weeks / 60) * 10) / 10,
                appid: game.appid
            })).filter(game => game.playtime > 0) // 플레이 시간이 있는 게임만
              .sort((a, b) => b.playtime - a.playtime);
            
            console.log(`${games.length}개 실제 게임 데이터 로드 완료`);
            
            res.json({
                success: true,
                steamId: steamId,
                games: games,
                count: games.length,
                note: "실제 Steam 데이터입니다!"
            });
        } else {
            throw new Error('Steam API에서 게임 데이터를 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('데이터 가져오기 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 친구 데이터 가져오기 API
app.get('/api/friend-data/:steamId', async (req, res) => {
    try {
        const steamId = req.params.steamId;
        console.log(`친구 Steam ID ${steamId} 데이터 요청`);
        
        const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
        
        console.log('친구 Steam Web API 호출:', steamApiUrl);
        
        const response = await fetch(steamApiUrl);
        const data = await response.json();
        
        console.log('친구 Steam API 응답:', data);
        
        if (data.response && data.response.games) {
            const games = data.response.games.map(game => ({
                name: game.name || `Game ${game.appid}`,
                playtime: Math.round((game.playtime_forever / 60) * 10) / 10,
                playtime2weeks: Math.round((game.playtime_2weeks / 60) * 10) / 10,
                appid: game.appid
            })).filter(game => game.playtime > 0)
              .sort((a, b) => b.playtime - a.playtime);
            
            console.log(`친구 ${games.length}개 실제 게임 파싱 성공`);
            
            res.json({
                success: true,
                steamId: steamId,
                games: games,
                count: games.length,
                note: "실제 Steam 데이터입니다!"
            });
        } else {
            throw new Error('Steam API에서 친구 게임 데이터를 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('친구 데이터 가져오기 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Steam 게임 분석 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
    console.log(`📊 API 엔드포인트:`);
    console.log(`   - 내 게임 데이터: http://localhost:${PORT}/api/steam-data/{steamId}`);
    console.log(`   - 친구 게임 데이터: http://localhost:${PORT}/api/friend-data/{steamId}`);
});
