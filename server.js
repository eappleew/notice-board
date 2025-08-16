const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS 설정
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Steam 데이터 가져오기 API
app.get('/api/steam-data/:steamId', async (req, res) => {
    try {
        const steamId = req.params.steamId;
        console.log(`Steam ID ${steamId} 데이터 요청`);
        
        // Steam API 키 (실제 키로 교체 필요)
        const STEAM_API_KEY = "62C597CD3CEC7C7AF3F2D60655C4A76B"; // 여기에 실제 API 키 입력
        
        if (STEAM_API_KEY === "62C597CD3CEC7C7AF3F2D60655C4A76B") {
            // API 키가 없으면 샘플 데이터 반환
            const sampleGames = generateSampleGames(steamId);
            console.log(`${sampleGames.length}개 샘플 게임 생성 완료`);
            
            res.json({
                success: true,
                steamId: steamId,
                games: sampleGames,
                count: sampleGames.length,
                note: "샘플 데이터입니다. Steam API 키를 발급받아 입력하세요!"
            });
        } else {
            // 실제 Steam API 호출
            const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
            
            console.log('실제 Steam API 호출:', steamApiUrl);
            
            const response = await fetch(steamApiUrl);
            const data = await response.json();
            
            console.log('Steam API 응답:', data);
            
            if (data.response && data.response.games) {
                const games = data.response.games.map(game => ({
                    name: game.name || `Game ${game.appid}`,
                    playtime: Math.round((game.playtime_forever / 60) * 10) / 10,
                    playtime2weeks: Math.round((game.playtime_2weeks / 60) * 10) / 10,
                    appid: game.appid
                })).filter(game => game.playtime > 0)
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
        
        // 샘플 친구 게임 데이터 생성
        const sampleGames = generateSampleGames(steamId + '_friend');
        
        console.log(`친구 ${sampleGames.length}개 샘플 게임 생성 완료`);
        
        res.json({
            success: true,
            steamId: steamId,
            games: sampleGames,
            count: sampleGames.length,
            note: "샘플 데이터입니다. 실제 Steam API 키가 필요합니다."
        });
        
    } catch (error) {
        console.error('친구 데이터 가져오기 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 고정된 테스트 데이터 생성 함수
function generateSampleGames(steamId) {
    // 항상 같은 테스트 데이터 반환 (석이 나가지 않도록!)
    const testGames = [
        { name: "Counter-Strike 2", playtime: 156, playtime2weeks: 12, appid: 730 },
        { name: "Dota 2", playtime: 89, playtime2weeks: 8, appid: 570 },
        { name: "PUBG: BATTLEGROUNDS", playtime: 234, playtime2weeks: 25, appid: 578080 },
        { name: "Grand Theft Auto V", playtime: 67, playtime2weeks: 3, appid: 271590 },
        { name: "Minecraft", playtime: 123, playtime2weeks: 15, appid: 322330 },
        { name: "Red Dead Redemption 2", playtime: 45, playtime2weeks: 0, appid: 1174180 },
        { name: "The Witcher 3: Wild Hunt", playtime: 78, playtime2weeks: 5, appid: 292030 },
        { name: "Fallout 4", playtime: 92, playtime2weeks: 7, appid: 377160 },
        { name: "Skyrim", playtime: 134, playtime2weeks: 18, appid: 72850 },
        { name: "Portal 2", playtime: 23, playtime2weeks: 2, appid: 620 }
    ];
    
    return testGames;
}

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Steam 게임 분석 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
    console.log(`📊 API 엔드포인트:`);
    console.log(`   - 내 게임 데이터: http://localhost:${PORT}/api/steam-data/{steamId}`);
    console.log(`   - 친구 게임 데이터: http://localhost:${PORT}/api/friend-data/{steamId}`);
});
