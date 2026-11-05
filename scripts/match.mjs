export function plain(value = '') {
  return String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}
export function safeUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
}
const skills = {
  Kotlin: /\bkotlin\b/i, Java: /\bjava\b/i, MVVM: /\bmvvm\b/i,
  Coroutines: /\bcoroutines?\b/i, Hilt: /\bhilt\b/i, Retrofit: /\bretrofit\b/i,
  Room: /\broom\b/i, Firebase: /\bfirebase\b/i, BLE: /\bble\b|bluetooth/i,
  SDK: /\bsdk\b/i, IPC: /\bipc\b/i, Serial: /\bserial\b/i
};
export function experienceMin(text) {
  const match = text.match(/\b(\d{1,2})(?:\s*[-–to]+\s*\d{1,2}|\s*\+)?\s*(?:years|yrs)\s*(?:(?:of|relevant|professional|industry|software|android|development|engineering|work|hands.on)\s*)*experience/i);
  return match ? Number(match[1]) : null;
}
export function assess(job) {
  const title = plain(job.title), description = plain(job.description), text = title + ' ' + description;
  // Kotlin alone can be backend; require evidence of Android work.
  if (!/\bandroid\b/i.test(text) || !/android|mobile|kotlin|sdk|software|engineer|developer/i.test(title)) return null;
  if (/\b(intern(?:ship)?|ios[- /]only|director|head of|principal|staff engineer)\b/i.test(title)) return null;
  const location = plain(job.location), loc = location.toLowerCase();
  const remote = Boolean(job.remote) || /\bremote\b|work from home/i.test(location);
  const restrictions = (job.countries || []).map(c => String(c).toLowerCase());
  let locationGroup, eligibility;
  if (/chennai/i.test(location)) { locationGroup = 'Chennai'; eligibility = 'Location match'; }
  else if (/bangalore|bengaluru/i.test(location)) { locationGroup = 'Bangalore'; eligibility = 'Location match'; }
  else if (remote) {
    if (restrictions.length && !restrictions.some(c => /^(india|in|worldwide|anywhere|global)$/.test(c))) return null;
    if (!restrictions.length && /\b(us|usa|united states|canada|uk|united kingdom|europe|emea|australia)\s*(only|remote)|remote\s*[-–:]?\s*(us|usa|united states|canada|uk|united kingdom|europe|emea|australia)\b/i.test(loc)) return null;
    locationGroup = 'Remote';
    eligibility = restrictions.some(c => /^(india|in)$/.test(c)) || /\bindia\b/i.test(location) ? 'India eligible' : restrictions.length || /worldwide|anywhere|global/i.test(location) ? 'Worldwide' : 'Check remote eligibility';
  } else return null;
  const minimum = experienceMin(text);
  if (minimum !== null && minimum > 5) return null;
  const matchedSkills = Object.entries(skills).filter(([, regex]) => regex.test(text)).map(([name]) => name);
  const review = [];
  if (/compose/i.test(text)) review.push('Compose mentioned; verify proficiency requirements');
  if (minimum === null) review.push('Experience requirement not parsed');
  if (/check/i.test(eligibility)) review.push('Confirm India and timezone eligibility');
  let salary = 'Salary not disclosed';
  if (Number.isFinite(job.maxSalary) && job.currency === 'INR' && job.salaryPeriod === 'annual') {
    salary = job.maxSalary >= 900000 ? 'Range reaches ₹9 LPA' : 'Below ₹9 LPA';
  } else if (job.minSalary || job.maxSalary) salary = 'Check currency and pay period';
  if (salary === 'Below ₹9 LPA') return null;
  const score = Math.min(95, 40 + matchedSkills.length * 4 + (minimum !== null && minimum <= 4 ? 10 : 0) + (eligibility === 'Check remote eligibility' ? 0 : 10));
  return {...job, title, description, location, locationGroup, eligibility, minimumExperience: minimum, matchedSkills, review, salaryStatus: salary, score};
}
export function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const url = safeUrl(job.url); if (!url) return false;
    const key = [plain(job.company).toLowerCase(), plain(job.title).toLowerCase(), job.locationGroup].join('|');
    if (seen.has(key)) return false;
    seen.add(key); job.url = url; return true;
  });
}
