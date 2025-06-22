// Утилита для форматирования даты в человекочитаемый вид
import moment from 'moment-timezone';

function formatDate(date) {
  // Конвертируем UTC дату в часовой пояс Asia/Bishkek
  const localDate = moment(date).tz('Asia/Bishkek');

  const day = String(localDate.date()).padStart(2, '0');
  const month = String(localDate.month() + 1).padStart(2, '0');
  const year = localDate.year();
  const hours = String(localDate.hours()).padStart(2, '0');
  const minutes = String(localDate.minutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Функция для возврата даты в ISO формате с правильным часовым поясом
function formatDateISO(date) {
  return moment(date).tz('Asia/Bishkek').format();
}

export { formatDate, formatDateISO };
