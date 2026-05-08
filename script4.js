let currentDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let habitTracker = JSON.parse(localStorage.getItem('habitTracker')) || {};
let pomodoroInterval = null;
let pomodoroTime = 25 * 60;
let pomodoroRunning = false;
let pomodoroMode = 'work';
let habitChart = null;
let currentFilter = '';

function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.contains('light-theme');
    
    if (isLight) {
        body.classList.remove('light-theme');
        document.querySelector('.theme-toggle').textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        document.querySelector('.theme-toggle').textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.querySelector('.theme-toggle').textContent = '☀️';
    }
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('habitTracker', JSON.stringify(habitTracker));
}

function initCalendar() {
    renderCalendar();
    document.getElementById('selectedDate').textContent = `Tasks for: ${formatDate(selectedDate)}`;
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('monthYear').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const el = document.createElement('div');
        el.className = 'day-header';
        el.textContent = day;
        el.style.cssText = 'padding:5px;text-align:center;font-weight:bold;color:#888;';
        calendar.appendChild(el);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        calendar.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const el = document.createElement('div');
        el.className = 'day';
        el.textContent = day;
        if (dateStr === today) el.classList.add('today');
        if (dateStr === selectedDate) el.style.background = '#7f08e6';
        el.onclick = () => selectDate(dateStr);
        calendar.appendChild(el);
    }
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    renderTracker();
    renderChart();
    calculateStats();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderTracker();
    renderChart();
    calculateStats();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    document.getElementById('selectedDate').textContent = `Tasks for: ${formatDate(dateStr)}`;
    renderCalendar();
    renderTasks();
    renderTracker();
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function addTask() {
    const input = document.getElementById('taskInput');
    const timeInput = document.getElementById('timeInput');
    const categorySelect = document.getElementById('categorySelect');
    const text = input.value.trim();
    const time = timeInput.value;
    const category = categorySelect.value;

    if (!text) return;

    tasks.push({ id: Date.now(), text, time, date: selectedDate, completed: false, category });
    saveData();
    renderTasks();
    calculateStats();
    input.value = '';
    timeInput.value = '';
    categorySelect.value = '';
}

function renderTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    let dayTasks = tasks.filter(t => t.date === selectedDate);
    
    if (currentFilter) {
        dayTasks = dayTasks.filter(t => t.category === currentFilter);
    }

    dayTasks.forEach(task => {
        const li = document.createElement('li');
        const categoryTag = task.category ? `<span class="category-tag category-${task.category}">${task.category}</span>` : '';
        li.innerHTML = `
            <span style="${task.completed ? 'text-decoration:line-through;opacity:0.5' : ''}">
                ${task.time ? `<b>[${task.time}]</b> ` : ''}${task.text}${categoryTag}
            </span>
            <div>
                <button onclick="toggleTask(${task.id})" style="padding:2px 6px;margin-right:3px;">
                    ${task.completed ? '↩' : '✓'}
                </button>
                <button onclick="deleteTask(${task.id})" style="padding:2px 6px;background:#ff5252;">✕</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function filterTasks(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === category || (category === '' && btn.textContent === 'All'));
    });
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
        calculateStats();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    renderTasks();
    calculateStats();
}

function addHabit() {
    const input = document.getElementById('habitInput');
    const text = input.value.trim();
    if (!text) return;

    habits.push({ id: Date.now(), name: text });
    saveData();
    renderHabits();
    renderTracker();
    renderChart();
    calculateStats();
    input.value = '';
    input.focus();
}
document.getElementById('habitInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addHabit();
    }
});
function renderHabits() {
    const list = document.getElementById('habitList');
    list.innerHTML = '';

    habits.forEach(habit => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${habit.name}</span>
            <button onclick="deleteHabit(${habit.id})" style="padding:2px 6px;background:#ff5252;">✕</button>
        `;
        list.appendChild(li);
    });
}

function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    // Remove all tracker entries for this habit
    Object.keys(habitTracker).forEach(key => {
        if (key.startsWith(`${id}-`)) {
            delete habitTracker[key];
        }
    });
    saveData();
    renderHabits();
    renderTracker();
    renderChart();
    calculateStats();
}

function renderTracker() {
    const grid = document.getElementById('trackerGrid');
    grid.innerHTML = '';

    if (habits.length === 0) {
        grid.innerHTML = '<p style="color:#888;">No habits to track</p>';
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedDay = parseInt(selectedDate.split('-')[2]);

    // Set up grid template columns for alignment
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `150px repeat(${daysInMonth}, 1fr)`;
    grid.style.overflowX = 'auto';

    // Header row
    const header = document.createElement('div');
    header.className = 'tracker-row';
    header.style.display = 'contents';
    header.innerHTML = `<div class="habit-name" style="background:none;"></div>` +
        Array.from({length: daysInMonth}, (_, i) => `<div class="tracker-header-day" style="text-align:center;font-size:11px;${selectedDay === i+1 ? 'background:#7f08e6;color:#fff;border-radius:4px;' : ''}">${i + 1}</div>`).join('');
    grid.appendChild(header);

    habits.forEach(habit => {
        const row = document.createElement('div');
        row.className = 'tracker-row';
        row.style.display = 'contents';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'habit-name';
        nameDiv.textContent = habit.name.length > 15 ? habit.name.substring(0, 15) + '...' : habit.name;
        row.appendChild(nameDiv);

        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${habit.id}-${year}-${month+1}-${day}`;
            const checked = habitTracker[key];

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = checked || false;
            checkbox.className = 'tracker-checkbox';
            if (selectedDay === day) checkbox.style.outline = '2px solid #ff4444';
            checkbox.onchange = () => toggleHabitDay(habit.id, year, month+1, day);
            row.appendChild(checkbox);
        }

        grid.appendChild(row);
    });
}

function toggleHabitDay(habitId, year, month, day) {
    const key = `${habitId}-${year}-${month}-${day}`;
    habitTracker[key] = !habitTracker[key];
    saveData();
    renderChart();
    calculateStats();
}

function renderChart() {
    const ctx = document.getElementById('habitChart').getContext('2d');
    if (habitChart) habitChart.destroy();

    const labels = [];
    const tasksData = [];
    const habitsData = [];

    // Calculate last 7 days ending on selectedDate
    const endD = new Date(selectedDate + 'T00:00:00');
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(endD);
        d.setDate(d.getDate() - i);
        
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        labels.push(`${month}/${day}`);

        const completedTasks = tasks.filter(t => t.date === dateStr && t.completed).length;
        tasksData.push(completedTasks);

        let completedHabits = 0;
        habits.forEach(h => {
            if (habitTracker[`${h.id}-${year}-${month}-${day}`]) {
                completedHabits++;
            }
        });
        habitsData.push(completedHabits);
    }

    habitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Tasks Done',
                    data: tasksData,
                    borderColor: '#ff0606',
                    backgroundColor: 'rgba(255, 6, 6, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Habits Done',
                    data: habitsData,
                    borderColor: '#7f08e6',
                    backgroundColor: 'rgba(127, 8, 230, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#e0e0e0' } },
                x: { ticks: { color: '#e0e0e0' } }
            },
            plugins: { legend: { labels: { color: '#e0e0e0' } } }
        }
    });
}

function startPomodoro() {
    if (pomodoroRunning) {
        clearInterval(pomodoroInterval);
        pomodoroRunning = false;
        document.getElementById('pomoBtn').textContent = 'Start';
        return;
    }
    
    pomodoroRunning = true;
    document.getElementById('pomoBtn').textContent = 'Pause';
    
    pomodoroInterval = setInterval(() => {
        pomodoroTime--;
        updatePomodoroDisplay();
        
        if (pomodoroTime <= 0) {
            clearInterval(pomodoroInterval);
            pomodoroRunning = false;
            alert(pomodoroMode === 'work' ? 'Time for a break!' : 'Break over, back to work!');
            if (pomodoroMode === 'work') {
                pomodoroMode = 'break';
                pomodoroTime = 5 * 60;
            } else {
                pomodoroMode = 'work';
                pomodoroTime = 25 * 60;
            }
            document.getElementById('pomoBtn').textContent = 'Start';
            updatePomodoroDisplay();
        }
    }, 1000);
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;
    pomodoroMode = 'work';
    pomodoroTime = 25 * 60;
    document.getElementById('pomoBtn').textContent = 'Start';
    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const mins = Math.floor(pomodoroTime / 60);
    const secs = pomodoroTime % 60;
    const display = document.getElementById('pomoDisplay');
    if (display) {
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        display.style.color = pomodoroMode === 'work' ? '#ff0606' : '#00cc66';
    }
}

function calculateStats() {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let bestStreak = 0;
    let totalHabitDays = 0;
    let completedHabitDays = 0;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    habits.forEach(habit => {
        let streak = 0;
        let currentStreak = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            if (habitTracker[`${habit.id}-${year}-${month+1}-${day}`]) {
                currentStreak++;
                if (currentStreak > streak) streak = currentStreak;
            } else {
                currentStreak = 0;
            }
            totalHabitDays++;
            if (habitTracker[`${habit.id}-${year}-${month+1}-${day}`]) completedHabitDays++;
        }
        if (streak > bestStreak) bestStreak = streak;
    });

    const habitRate = totalHabitDays > 0 ? Math.round((completedHabitDays / totalHabitDays) * 100) : 0;

    document.getElementById('taskCompleted').textContent = completedTasks;
    document.getElementById('taskRate').textContent = taskRate + '%';
    document.getElementById('habitStreak').textContent = bestStreak;
    document.getElementById('habitRate').textContent = habitRate + '%';
}

window.onload = function() {
    loadTheme();
    initCalendar();
    renderTasks();
    renderHabits();
    renderTracker();
    renderChart();
    updatePomodoroDisplay();
    calculateStats();
};