# Система статистики пользователей MathGenie

## Обзор

Система статистики предоставляет расширенную аналитику для обучающего приложения MathGenie, включая:

1. **Гистограмма по пройденным тестам** - показывает успеваемость по каждому предмету
2. **Линейный график прогресса** - отслеживает изменения точности с течением времени
3. **Персонализированные рекомендации** - автоматически определяет слабые темы и предлагает тесты

## Архитектура

### Модели данных

#### UserStatistics
Основная модель для хранения агрегированной статистики пользователя:

```javascript
{
  user: ObjectId,           // Ссылка на пользователя
  subjectStats: [           // Статистика по предметам
    {
      subject: ObjectId,    // Предмет
      totalTests: Number,   // Общее количество тестов
      totalQuestions: Number, // Общее количество вопросов
      correctAnswers: Number, // Правильные ответы
      averageScore: Number,   // Средний балл в %
      lastTestDate: Date,     // Дата последнего теста
      progressTrend: [        // Тренд прогресса
        { date: Date, score: Number }
      ]
    }
  ],
  weakTopics: [             // Слабые темы
    {
      topic: ObjectId,      // Тема
      subject: ObjectId,    // Предмет
      averageScore: Number, // Средний балл
      testCount: Number,    // Количество тестов
      lastTestDate: Date    // Дата последнего теста
    }
  ],
  recommendations: [        // Рекомендации
    {
      type: String,         // 'topic' или 'test'
      targetId: ObjectId,   // ID целевого объекта
      reason: String,       // Причина рекомендации
      priority: Number      // Приоритет (1-высокий, 2-средний)
    }
  ],
  lastUpdated: Date         // Время последнего обновления
}
```

## API Эндпоинты

### 1. Получить общую статистику
```
GET /api/statistics/overview
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "subjectChartData": [
      {
        "subjectName": "Математика",
        "totalTests": 5,
        "totalQuestions": 75,
        "correctAnswers": 60,
        "averageScore": 80,
        "accuracy": 80
      }
    ],
    "weakTopics": [
      {
        "topicName": "Логика",
        "subjectName": "Математика",
        "averageScore": 43,
        "testCount": 2,
        "lastTestDate": "2024-01-15T10:30:00.000Z"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Получить прогресс по времени
```
GET /api/statistics/progress?subjectId=optional
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15T10:30:00.000Z",
      "score": 75
    },
    {
      "date": "2024-01-16T14:20:00.000Z",
      "score": 80
    }
  ]
}
```

### 3. Получить рекомендации
```
GET /api/statistics/recommendations
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "test",
        "targetId": "507f1f77bcf86cd799439011",
        "targetName": "Тест по логике",
        "reason": "Повторите тему 'Логика' - ваш средний балл 43%",
        "priority": 1
      }
    ],
    "weakTopics": [
      {
        "topicName": "Логика",
        "subjectName": "Математика",
        "averageScore": 43,
        "testCount": 2,
        "recommendation": "Тебе стоит сосредоточиться на 'Логике' — 43% правильных"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Обновить статистику
```
POST /api/statistics/update
```

## Алгоритмы

### Определение слабых тем
- Темы со средним баллом ниже 60% считаются слабыми
- Система анализирует последние 10 тестов по каждой теме
- Приоритет отдается темам с наибольшим количеством тестов

### Генерация рекомендаций
1. **По слабым темам**: Предлагает тесты по темам с низким баллом
2. **По предметам**: Предлагает темы по предметам со средним баллом ниже 70%
3. **Приоритизация**: Рекомендации сортируются по приоритету (1-высокий, 2-средний)

### Расчет прогресса
- Прогресс рассчитывается как средний балл по всем тестам за день
- При запросе по конкретному предмету показывается прогресс только по нему
- Данные группируются по дате для устранения дублирования

## Интеграция

### Автоматическое обновление
Статистика автоматически обновляется после каждого завершенного теста в функции `submitTest` контроллера тестов.

### AdminJS
Модель `UserStatistics` добавлена в админку с возможностью просмотра статистики пользователей.

### Swagger
Все эндпоинты документированы в Swagger с примерами запросов и ответов.

## Использование

### Для фронтенда

1. **Гистограмма**: Используйте данные из `/api/statistics/overview` для построения гистограммы по предметам
2. **Линейный график**: Используйте данные из `/api/statistics/progress` для построения графика прогресса
3. **Рекомендации**: Используйте данные из `/api/statistics/recommendations` для отображения персонализированных советов

### Примеры использования

```javascript
// Получить статистику для гистограммы
const response = await fetch('/api/statistics/overview', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { subjectChartData } = await response.json();

// Построить гистограмму
subjectChartData.forEach(subject => {
  console.log(`${subject.subjectName}: ${subject.accuracy}%`);
});

// Получить прогресс для линейного графика
const progressResponse = await fetch('/api/statistics/progress', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const progressData = await progressResponse.json();

// Построить график прогресса
progressData.data.forEach(point => {
  console.log(`${point.date}: ${point.score}%`);
});

// Получить рекомендации
const recommendationsResponse = await fetch('/api/statistics/recommendations', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { recommendations, weakTopics } = await recommendationsResponse.json();

// Показать рекомендации
recommendations.forEach(rec => {
  console.log(`${rec.reason} (${rec.targetName})`);
});
```

## Производительность

- Статистика кэшируется в модели `UserStatistics`
- Обновление происходит асинхронно после завершения теста
- Индексы оптимизированы для быстрых запросов
- Данные агрегируются на уровне базы данных

## Безопасность

- Все эндпоинты требуют авторизации
- Пользователи могут видеть только свою статистику
- Данные валидируются на уровне контроллера 