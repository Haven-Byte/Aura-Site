export type ClockAngles = {
  hour: number;
  minute: number;
  accent: number;
};

export type ClockSnapshot = {
  timestamp: number;
  angles: ClockAngles;
  month: string;
  day: string;
  year: string;
};

export function getAngles(timestamp: number): ClockAngles {
  const date = new Date(timestamp);
  const milliseconds = date.getMilliseconds();
  const seconds = date.getSeconds() + milliseconds / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;

  return {
    hour: hours * 30,
    minute: minutes * 6,
    accent: seconds * 6,
  };
}

export function buildClockSnapshot(timestamp: number): ClockSnapshot {
  const date = new Date(timestamp);
  const dateParts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).formatToParts(date);
  const month = dateParts.find((part) => part.type === "month")?.value ?? "APR";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "01";
  const year = dateParts.find((part) => part.type === "year")?.value ?? "2026";

  return {
    timestamp,
    angles: getAngles(timestamp),
    month: month.toUpperCase(),
    day,
    year,
  };
}
