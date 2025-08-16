// Steam Community에서 직접 데이터 가져오기
async function loadSteamData(steamId, friendIds) {
    try {
        console.log(`Steam ID ${steamId}로 Steam Community에서 데이터 로딩 시작`);
        
        // 로딩 표시
        document.getElementById('setup-tab').innerHTML = `
            <h2>🎮 Steam Community에서 데이터 로딩 중...</h2>
            <div style="text-align: center; padding: 50px;">
                <div class="loading"></div>
                <p>Steam ID ${steamId}로 Steam Community에서 데이터를 가져오는 중...</p>
                <p>잠시만 기다려주세요...</p>
            </div>
        `;
        
        // Steam Community 페이지에서 직접 데이터 가져오기
        console.log('Steam Community 페이지 호출 시도...');
        const response = await fetch(`https://steamcommunity.com/profiles/${steamId}/games/?tab=all`);
        const html = await response.text();
        console.log('Steam Community 페이지 로드 성공!');
        
        // HTML에서 게임 데이터 파싱
        const gameData = parseSteamHTML(html, steamId);
        console.log(`${gameData.length}개 게임 파싱 완료`);
        
        // 친구 데이터도 로드
        let friendsData = {};
        if (friendIds) {
            const friendIdList = friendIds.split(',').map(id => id.trim());
            for (const friendId of friendIdList) {
                if (friendId) {
                    if (!/^\d{17}$/.test(friendId)) {
                        console.warn(`친구 ID ${friendId}는 올바른 Steam ID 형식이 아닙니다. 건너뜁니다.`);
                        continue;
                    }
                    
                    try {
                        console.log(`친구 Steam ID ${friendId} 데이터 로딩 중...`);
                        const friendResponse = await fetch(`https://steamcommunity.com/profiles/${friendId}/games/?tab=all`);
                        const friendHtml = await friendResponse.text();
                        const friendGameData = parseSteamHTML(friendHtml, friendId);
                        friendsData[friendId] = friendGameData;
                        console.log(`친구 ${friendId}: ${friendGameData.length}개 게임 파싱 완료`);
                    } catch (error) {
                        console.error(`친구 ${friendId} 데이터 로드 실패:`, error);
                    }
                }
            }
        }
        
        // 데이터 설정
        currentData = { myGames: gameData, friendsGames: friendsData };
        
        // 성공 메시지
        document.getElementById('setup-tab').innerHTML = `
            <h2>✅ Steam Community에서 데이터 로드 완료!</h2>
            <div style="text-align: center; padding: 50px;">
                <p>게임 ${gameData.length}개를 성공적으로 가져왔습니다!</p>
                <button class="btn" onclick="showTab('stats-tab')">�� 분석 결과 보기</button>
                <button class="btn btn-secondary" onclick="restoreSetupTab()">⚙️ 설정으로 돌아가기</button>
            </div>
        `;
        
        // 기본 통계 표시
        updateBasicStats();
        showTab('stats-tab');
        
    } catch (error) {
        console.error('Steam Community 데이터 로드 실패:', error);
        
        // 에러 메시지 표시
        document.getElementById('setup-tab').innerHTML = `
            <h2>❌ Steam Community 데이터 로드 실패</h2>
            <div style="text-align: center; padding: 50px;">
                <p>Steam Community에서 데이터를 가져올 수 없습니다.</p>
                <p>원인: ${error.message}</p>
                <p><strong>가능한 원인:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Steam 프로필이 비공개로 설정됨</li>
                    <li>Steam ID가 존재하지 않음</li>
                    <li>CORS 정책 문제</li>
                    <li>네트워크 연결 문제</li>
                </ul>
                <button class="btn" onclick="location.reload()">🔄 다시 시도</button>
                <button class="btn btn-secondary" onclick="restoreSetupTab()">⚙️ 설정으로 돌아가기</button>
            </div>
        `;
    }
}
