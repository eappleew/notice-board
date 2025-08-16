// Steam 게임 분석기 JavaScript 파일

// 전역 변수 (빈 객체로 시작)
let currentData = { myGames: [], friendsGames: {} };
let currentTab = 'setup-tab';

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Steam 게임 분석기 로드됨');
    showTab('setup-tab');
});

// 탭 전환 함수
function showTab(tabId) {
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 모든 탭 비활성화
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    document.getElementById(tabId).classList.add('active');
    
    // 탭 버튼 활성화
    const tabButton = document.querySelector(`[onclick="showTab('${tabId}')"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    currentTab = tabId;
    
    // 탭별 차트 생성
    if (tabId === 'my-games-tab') {
        createTopGamesChart();
        updateMyGamesTable();
    } else if (tabId === 'common-games-tab') {
        createCommonGamesChart();
        updateCommonGamesTable();
    } else if (tabId === 'missing-games-tab') {
        createMissingGamesChart();
        updateMissingGamesTable();
    } else if (tabId === 'analysis-tab') {
        createComparisonChart();
        createHeatmapChart();
        createDistributionChart();
    } else if (tabId === 'slaves-tab') {
        createSlavesChart();
        updateSlavesTable();
    }
}

// 분석 시작 함수
function startAnalysis() {
    const mySteamId = document.getElementById('steam-id').value.trim();
    const friendIds = document.getElementById('friend-ids').value.trim();
    
    // 입력 검증
    if (!mySteamId) {
        alert('내 Steam ID를 입력하세요!');
        return;
    }
    
    // Steam ID 형식 검증 (17자리 숫자)
    if (!/^\d{17}$/.test(mySteamId)) {
        alert('Steam ID는 17자리 숫자여야 합니다!\n예: 76561198000000000');
        return;
    }
    
    console.log('분석 시작:', { mySteamId, friendIds });
    
    // Vercel 배포된 서버에서 Steam 데이터 가져오기
    loadSteamData(mySteamId, friendIds);
}

// Vercel 배포된 서버에서 Steam 데이터 가져오기
async function loadSteamData(steamId, friendIds) {
    try {
        console.log(`Steam ID ${steamId}로 Vercel 서버에서 데이터 로딩 시작`);
        
        // 로딩 표시
        document.getElementById('setup-tab').innerHTML = `
            <h2>🎮 Vercel 서버에서 Steam 데이터 로딩 중...</h2>
            <div style="text-align: center; padding: 50px;">
                <div class="loading"></div>
                <p>Steam ID ${steamId}로 Vercel 서버를 통해 Steam 데이터를 가져오는 중...</p>
                <p>잠시만 기다려주세요...</p>
            </div>
        `;
        
        // Vercel API 호출
        console.log('Vercel API 호출 시도...');
        const response = await fetch(`https://steam-data-nine.vercel.app/api/steam-data/${steamId}`);
        const data = await response.json();
        console.log('Vercel API 호출 성공!', data);
        
        if (data.success) {
            // Vercel에서 받은 게임 데이터 사용
            const gameData = data.games;
            
            // 친구 데이터도 로드
            let friendsData = {};
            if (friendIds) {
                const friendIdList = friendIds.split(',').map(id => id.trim());
                for (const friendId of friendIdList) {
                    if (friendId) {
                        // Steam ID 형식 검증
                        if (!/^\d{17}$/.test(friendId)) {
                            console.warn(`친구 ID ${friendId}는 올바른 Steam ID 형식이 아닙니다. 건너뜁니다.`);
                            continue;
                        }
                        
                        try {
                            console.log(`친구 Steam ID ${friendId} 데이터 로딩 중...`);
                            
                            // Vercel API로 친구 데이터 가져오기
                            console.log(`친구 Steam ID ${friendId} Vercel API 호출 시도...`);
                            const friendResponse = await fetch(`https://steam-data-nine.vercel.app/api/friend-data/${friendId}`);
                            const friendApiData = await friendResponse.json();
                            console.log('친구 Vercel API 호출 성공!', friendApiData);
                            
                            if (friendApiData.success) {
                                friendsData[friendId] = friendApiData.games;
                            }
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
                <h2>✅ Vercel 서버에서 Steam 데이터 로드 완료!</h2>
                <div style="text-align: center; padding: 50px;">
                    <p>게임 ${gameData.length}개를 성공적으로 가져왔습니다!</p>
                    <button class="btn" onclick="showTab('stats-tab')">�� 분석 결과 보기</button>
                    <button class="btn btn-secondary" onclick="restoreSetupTab()">⚙️ 설정으로 돌아가기</button>
                </div>
            `;
            
            // 기본 통계 표시
            updateBasicStats();
            showTab('stats-tab');
            
        } else {
            throw new Error('Vercel 서버에서 데이터를 가져올 수 없습니다.');
        }
        
    } catch (error) {
        console.error('Vercel 서버 데이터 로드 실패:', error);
        
        // 에러 메시지 표시
        document.getElementById('setup-tab').innerHTML = `
            <h2>❌ Vercel 서버 데이터 로드 실패</h2>
            <div style="text-align: center; padding: 50px;">
                <p>Vercel 서버에서 Steam 데이터를 가져올 수 없습니다.</p>
                <p>원인: ${error.message}</p>
                <p><strong>가능한 원인:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Steam 프로필이 비공개로 설정됨</li>
                    <li>Steam ID가 존재하지 않음</li>
                    <li>네트워크 연결 문제</li>
                    <li>Vercel 서버 오류</li>
                </ul>
                <button class="btn" onclick="location.reload()">🔄 다시 시도</button>
                <button class="btn btn-secondary" onclick="restoreSetupTab()">⚙️ 설정으로 돌아가기</button>
            </div>
        `;
    }
}

// Steam ID 형식 검증
function validateSteamId(steamId) {
    return /^\d{17}$/.test(steamId);
}

// 설정으로 돌아가기 버튼 추가
function addBackToSetupButton(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        // 기존에 추가된 버튼들을 모두 제거
        const existingButtons = tab.querySelectorAll('.back-to-setup');
        existingButtons.forEach(button => button.remove());
        
        // 새로운 버튼 추가
        const backButton = document.createElement('div');
        backButton.className = 'back-to-setup';
        backButton.style.textAlign = 'center';
        backButton.style.marginTop = '20px';
        backButton.style.padding = '20px';
        backButton.innerHTML = '<button class="btn btn-secondary" onclick="restoreSetupTab()">⚙️ 설정으로 돌아가기</button>';
        tab.appendChild(backButton);
    }
}

// 설정 탭 복원 함수
function restoreSetupTab() {
    // setup-tab 내용을 원래대로 복원
    const setupTab = document.getElementById('setup-tab');
    setupTab.innerHTML = `
        <h2>�� Steam 게임 분석기</h2>
        <p>Steam ID를 입력하여 본인과 친구들의 게임 플레이 시간을 분석해보세요!</p>
        
        <div class="alert alert-warning">
            <strong>⚠️ Steam ID 사용법:</strong><br>
            • Steam 프로필 링크의 17자리 숫자<br>
            • 예: https://steamcommunity.com/profiles/76561198000000000<br>
            • <strong>프로필 링크에서 숫자만 복사해서 입력하세요!</strong>
        </div>
            
        <div class="input-group">
            <label for="steam-id">내 Steam ID</label>
            <input type="text" id="steam-id" placeholder="76561198000000000">
            <small style="color: #666; font-size: 0.9rem;">Steam 프로필 링크의 17자리 숫자</small>
        </div>
        
        <div class="input-group">
            <label for="friend-ids">친구 Steam ID 목록 (쉼표로 구분, 선택사항)</label>
            <textarea id="friend-ids" rows="3" placeholder="76561198000000001, 76561198000000002, 76561198000000003"></textarea>
            <small style="color: #666; font-size: 0.9rem;">친구들의 Steam ID (17자리 숫자)</small>
        </div>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="startAnalysis()">🚀 분석 시작</button>
        </div>
    `;
    
    // setup-tab으로 이동
    showTab('setup-tab');
}

// 기본 통계 업데이트
function updateBasicStats() {
    const myGames = currentData.myGames;
    if (myGames.length === 0) {
        document.getElementById('game-count').textContent = '0개';
        document.getElementById('total-time').textContent = '0시간';
        document.getElementById('avg-time').textContent = '0시간';
        document.getElementById('top-game').textContent = '없음';
        return;
    }
    
    const totalPlaytime = myGames.reduce((sum, game) => sum + game.playtime, 0);
    const avgPlaytime = totalPlaytime / myGames.length;
    
    document.getElementById('game-count').textContent = myGames.length + '개';
    document.getElementById('total-time').textContent = totalPlaytime + '시간';
    document.getElementById('avg-time').textContent = avgPlaytime.toFixed(1) + '시간';
    document.getElementById('top-game').textContent = myGames[0].name;
    
    // 설정으로 돌아가기 버튼 추가
    addBackToSetupButton('stats-tab');
}

// 내 Top 게임 차트 생성
function createTopGamesChart() {
    const myGames = currentData.myGames.slice(0, 10);
    
    if (myGames.length === 0) {
        document.getElementById('top-games-chart').innerHTML = '<p>게임 데이터가 없습니다.</p>';
        return;
    }
    
    const data = [{
        x: myGames.map(g => g.playtime),
        y: myGames.map(g => g.name),
        type: 'bar',
        orientation: 'h',
        marker: { 
            color: myGames.map((_, i) => `hsl(${200 + i * 20}, 70%, 60%)`),
            opacity: 0.8
        },
        text: myGames.map(g => g.playtime + '시간'),
        textposition: 'auto'
    }];
    
    const layout = {
        title: '내가 제일 열심히 한 게임 TOP 10',
        xaxis: { title: '플레이 시간 (시간)' },
        yaxis: { title: '게임명' },
        height: 500,
        margin: { l: 200, r: 50, t: 50, b: 50 },
        showlegend: false
    };
    
    Plotly.newPlot('top-games-chart', data, layout);
}

// 내 게임 테이블 업데이트
function updateMyGamesTable() {
    const tbody = document.querySelector('#my-games-table tbody');
    tbody.innerHTML = '';
    
    if (currentData.myGames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">게임 데이터가 없습니다.</td></tr>';
        return;
    }
    
    currentData.myGames.slice(0, 10).forEach((game, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${game.name}</td>
            <td>${game.playtime}시간</td>
            <td>${game.playtime2weeks}시간</td>
        `;
    });
    
    // 설정으로 돌아가기 버튼 추가
    addBackToSetupButton('my-games-tab');
}

// 공통 게임 차트 생성
function createCommonGamesChart() {
    const commonGames = findCommonGames();
    
    if (commonGames.length === 0) {
        document.getElementById('common-games-chart').innerHTML = '<p>공통 게임이 없습니다.</p>';
        return;
    }
    
    const data = [
        {
            name: '나',
            x: commonGames.map(g => g.name),
            y: commonGames.map(g => g.myPlaytime),
            type: 'bar',
            marker: { color: '#1f77b4' }
        },
        {
            name: '친구 평균',
            x: commonGames.map(g => g.name),
            y: commonGames.map(g => g.avgFriendPlaytime),
            type: 'bar',
            marker: { color: '#ff7f0e' }
        }
    ];
    
    const layout = {
        title: '공통 게임 플레이 시간 비교',
        xaxis: { title: '게임명' },
        yaxis: { title: '플레이 시간 (시간)' },
        barmode: 'group',
        height: 500,
        margin: { b: 100 }
    };
    
    Plotly.newPlot('common-games-chart', data, layout);
}

// 공통 게임 찾기
function findCommonGames() {
    const myGames = currentData.myGames;
    const friendsGames = currentData.friendsGames;
    const commonGames = [];
    
    myGames.forEach(myGame => {
        let totalFriendPlaytime = 0;
        let friendCount = 0;
        
        Object.values(friendsGames).forEach(friendGameList => {
            const friendGame = friendGameList.find(g => g.appid === myGame.appid);
            if (friendGame) {
                totalFriendPlaytime += friendGame.playtime;
                friendCount++;
            }
        });
        
        if (friendCount > 0) {
            commonGames.push({
                name: myGame.name,
                myPlaytime: myGame.playtime,
                avgFriendPlaytime: totalFriendPlaytime / friendCount,
                friendCount: friendCount
            });
        }
    });
    
    return commonGames.sort((a, b) => b.myPlaytime - a.myPlaytime);
}

// 공통 게임 테이블 업데이트
function updateCommonGamesTable() {
    const tbody = document.querySelector('#common-games-table tbody');
    tbody.innerHTML = '';
    
    const commonGames = findCommonGames();
    if (commonGames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">공통 게임이 없습니다.</td></tr>';
        return;
    }
    
    commonGames.forEach(game => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${game.name}</td>
            <td>${game.myPlaytime}시간</td>
            <td>${game.avgFriendPlaytime.toFixed(1)}시간</td>
            <td>${game.friendCount}명</td>
        `;
    });
    
    // 설정으로 돌아가기 버튼 추가
    addBackToSetupButton('common-games-tab');
}

// 누락된 게임 차트 생성
function createMissingGamesChart() {
    const missingGames = findMissingGames();
    
    if (missingGames.length === 0) {
        document.getElementById('missing-games-chart').innerHTML = '<p>추천할 게임이 없습니다.</p>';
        return;
    }
    
    const data = [{
        x: missingGames.map(g => g.totalPlaytime),
        y: missingGames.map(g => g.name),
        type: 'bar',
        orientation: 'h',
        marker: { 
            color: missingGames.map((_, i) => `hsl(${350 + i * 15}, 70%, 60%)`),
            opacity: 0.8
        },
        text: missingGames.map(g => g.totalPlaytime + '시간'),
        textposition: 'auto'
    }];
    
    const layout = {
        title: '친구들이 많이 하는 게임 (본인 미소유)',
        xaxis: { title: '친구들 총 플레이 시간 (시간)' },
        yaxis: { title: '게임명' },
        height: 500,
        margin: { l: 200, r: 50, t: 50, b: 50 }
    };
    
    Plotly.newPlot('missing-games-chart', data, layout);
}

// 누락된 게임 찾기
function findMissingGames() {
    const myGameIds = new Set(currentData.myGames.map(g => g.appid));
    const friendsGames = currentData.friendsGames;
    const gameStats = {};
    
    Object.values(friendsGames).forEach(friendGameList => {
        friendGameList.forEach(game => {
            if (!myGameIds.has(game.appid)) {
                if (!gameStats[game.appid]) {
                    gameStats[game.appid] = {
                        name: game.name,
                        totalPlaytime: 0,
                        friendCount: 0
                    };
                }
                gameStats[game.appid].totalPlaytime += game.playtime;
                gameStats[game.appid].friendCount++;
            }
        });
    });
    
    return Object.values(gameStats)
        .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
        .slice(0, 15);
}

// 누락된 게임 테이블 업데이트
function updateMissingGamesTable() {
    const tbody = document.querySelector('#missing-games-table tbody');
    tbody.innerHTML = '';
    
    const missingGames = findMissingGames();
    if (missingGames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">추천할 게임이 없습니다.</td></tr>';
        return;
    }
    
    missingGames.forEach(game => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${game.name}</td>
            <td>${game.totalPlaytime}시간</td>
            <td>${(game.totalPlaytime / game.friendCount).toFixed(1)}시간</td>
            <td>${game.friendCount}명</td>
        `;
    });
    
    // 설정으로 돌아가기 버튼 추가
    addBackToSetupButton('missing-games-tab');
}

// 비교 차트 생성
function createComparisonChart() {
    const myGames = currentData.myGames.slice(0, 15);
    const friendsGames = currentData.friendsGames;
    
    if (myGames.length === 0) {
        document.getElementById('comparison-chart').innerHTML = '<p>게임 데이터가 없습니다.</p>';
        return;
    }
    
    const data = [
        {
            name: '나',
            x: myGames.map(g => g.name),
            y: myGames.map(g => g.playtime),
            type: 'bar',
            marker: { color: '#1f77b4' }
        }
    ];
    
    // 친구들 데이터 추가
    Object.entries(friendsGames).forEach(([friendId, games], index) => {
        const friendPlaytimes = myGames.map(myGame => {
            const friendGame = games.find(g => g.appid === myGame.appid);
            return friendGame ? friendGame.playtime : 0;
        });
        
        data.push({
            name: `친구 ${friendId}`,
            x: myGames.map(g => g.name),
            y: friendPlaytimes,
            type: 'bar',
            marker: { color: `hsl(${120 + index * 60}, 70%, 60%)` },
            opacity: 0.7
        });
    });
    
    const layout = {
        title: '본인 vs 친구들 플레이 시간 비교',
        xaxis: { title: '게임명' },
        yaxis: { title: '플레이 시간 (시간)' },
        barmode: 'group',
        height: 500,
        margin: { b: 100 }
    };
    
    Plotly.newPlot('comparison-chart', data, layout);
}

// 히트맵 차트 생성
function createHeatmapChart() {
    const myGames = currentData.myGames.slice(0, 20);
    const friendsGames = currentData.friendsGames;
    
    if (myGames.length === 0) {
        document.getElementById('heatmap-chart').innerHTML = '<p>게임 데이터가 없습니다.</p>';
        return;
    }
    
    const z = [myGames.map(g => g.playtime)];
    const y = myGames.map(g => g.name);
    const x = ['나'];
    
    Object.keys(friendsGames).forEach(friendId => {
        x.push(`친구 ${friendId}`);
        const friendPlaytimes = myGames.map(myGame => {
            const friendGame = friendsGames[friendId].find(g => g.appid === myGame.appid);
            return friendGame ? friendGame.playtime : 0;
        });
        z.push(friendPlaytimes);
    });
    
    const data = [{
        z: z,
        x: x,
        y: y,
        type: 'heatmap',
        colorscale: 'Viridis'
    }];
    
    const layout = {
        title: '게임별 플레이 시간 히트맵',
        xaxis: { title: '플레이어' },
        yaxis: { title: '게임명' },
        height: 500
    };
    
    Plotly.newPlot('heatmap-chart', data, layout);
}

// 분포 차트 생성
function createDistributionChart() {
    const myGames = currentData.myGames;
    const friendsGames = currentData.friendsGames;
    
    if (myGames.length === 0) {
        document.getElementById('distribution-chart').innerHTML = '<p>게임 데이터가 없습니다.</p>';
        return;
    }
    
    const data = [
        {
            x: myGames.map(g => g.playtime),
            type: 'histogram',
            name: '나',
            opacity: 0.7,
            marker: { color: '#1f77b4' }
        }
    ];
    
    Object.entries(friendsGames).forEach(([friendId, games], index) => {
        data.push({
            x: games.map(g => g.playtime),
            type: 'histogram',
            name: `친구 ${friendId}`,
            opacity: 0.5,
            marker: { color: `hsl(${120 + index * 60}, 70%, 60%)` }
        });
    });
    
    const layout = {
        title: '플레이 시간 분포 비교',
        xaxis: { title: '플레이 시간 (시간)' },
        yaxis: { title: '게임 수' },
        barmode: 'overlay',
        height: 500
    };
    
    Plotly.newPlot('distribution-chart', data, layout);
}

// 게임 노예 차트 생성
function createSlavesChart() {
    const gameSlaves = findGameSlaves();
    
    if (gameSlaves.length === 0) {
        document.getElementById('slaves-chart').innerHTML = '<p>분석할 데이터가 없습니다.</p>';
        return;
    }
    
    const data = [{
        x: gameSlaves.map(g => g.slavePlaytime),
        y: gameSlaves.map(g => g.name),
        type: 'bar',
        orientation: 'h',
        marker: { 
            color: gameSlaves.map((_, i) => `hsl(${300 + i * 20}, 70%, 60%)`),
            opacity: 0.8
        },
        text: gameSlaves.map(g => g.slavePlaytime + '시간'),
        textposition: 'auto'
    }];
    
    const layout = {
        title: '�� 게임별 "노예" 친구 TOP 15 ��',
        xaxis: { title: '플레이 시간 (시간)' },
        yaxis: { title: '게임명' },
        height: 500,
        margin: { l: 200, r: 50, t: 50, b: 50 }
    };
    
    Plotly.newPlot('slaves-chart', data, layout);
}

// 게임 노예 찾기
function findGameSlaves() {
    const friendsGames = currentData.friendsGames;
    const gameStats = {};
    
    Object.entries(friendsGames).forEach(([friendId, games]) => {
        games.forEach(game => {
            if (!gameStats[game.appid]) {
                gameStats[game.appid] = {
                    name: game.name,
                    players: []
                };
            }
            gameStats[game.appid].players.push({
                friendId: friendId,
                playtime: game.playtime
            });
        });
    });
    
    return Object.values(gameStats)
        .map(game => {
            const topPlayer = game.players.reduce((max, player) => 
                player.playtime > max.playtime ? player : max
            );
            return {
                name: game.name,
                slaveFriendId: topPlayer.friendId,
                slavePlaytime: topPlayer.playtime,
                totalPlayers: game.players.length
            };
        })
        .sort((a, b) => b.slavePlaytime - a.slavePlaytime)
        .slice(0, 15);
}

// 게임 노예 테이블 업데이트
function updateSlavesTable() {
    const tbody = document.querySelector('#slaves-table tbody');
    tbody.innerHTML = '';
    
    const gameSlaves = findGameSlaves();
    if (gameSlaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">분석할 데이터가 없습니다.</td></tr>';
        return;
    }
    
    gameSlaves.forEach(game => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${game.name}</td>
            <td>${game.slaveFriendId}</td>
            <td>${game.slavePlaytime}시간</td>
            <td>${game.totalPlayers}명</td>
        `;
    });
    
    // 설정으로 돌아가기 버튼 추가
    addBackToSetupButton('slaves-tab');
}

// 전역 함수로 노출
window.showTab = showTab;
window.startAnalysis = startAnalysis;
