/**
 * Seed script — creates the default admin and realistic sample data.
 *
 *   npm run seed            → admin + sample members, payments, attendance, charts
 *   npm run seed:admin      → admin account only
 *   npm run seed -- --reset → wipe ALL collections first, then seed everything
 *
 * Default admin: admin@gym.com / admin123   (change the password after first login!)
 * Sample members: <firstname>@example.com / member123
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { addDays, startOfDay, subDays, subMonths } from 'date-fns';

config({ path: '.env.local' });
config();

import User from '../src/models/User';
import Payment from '../src/models/Payment';
import Attendance from '../src/models/Attendance';
import WorkoutChart from '../src/models/WorkoutChart';
import Settings from '../src/models/Settings';
import { MEMBERSHIP_PRICING } from '../src/lib/constants';

const args = new Set(process.argv.slice(2));
const ADMIN_ONLY = args.has('--admin-only');
const RESET = args.has('--reset');

// Deterministic PRNG so the sample data is the same on every run.
let seed = 42;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

type Category = 'normal' | 'cardio' | 'personal_training';

const SAMPLE_MEMBERS: {
  name: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  bodyType: string;
  goal: string;
  category: Category;
  monthsAgo: number;
  health?: string;
  attendanceRate: number;
}[] = [
  { name: 'Kasun Perera', gender: 'male', age: 27, weight: 78, height: 175, bodyType: 'Average', goal: 'Muscle gain', category: 'normal', monthsAgo: 5, attendanceRate: 0.75 },
  { name: 'Nimali Fernando', gender: 'female', age: 31, weight: 64, height: 162, bodyType: 'Average', goal: 'Weight loss', category: 'cardio', monthsAgo: 4, attendanceRate: 0.65 },
  { name: 'Tharindu Silva', gender: 'male', age: 23, weight: 68, height: 178, bodyType: 'Slim', goal: 'Muscle gain', category: 'personal_training', monthsAgo: 3, attendanceRate: 0.85 },
  { name: 'Dilini Jayasinghe', gender: 'female', age: 26, weight: 57, height: 158, bodyType: 'Slim', goal: 'General fitness', category: 'cardio', monthsAgo: 3, attendanceRate: 0.5 },
  { name: 'Ruwan Wickramasinghe', gender: 'male', age: 38, weight: 92, height: 172, bodyType: 'Overweight', goal: 'Weight loss', category: 'personal_training', monthsAgo: 2, health: 'Mild lower back pain — avoid heavy deadlifts', attendanceRate: 0.6 },
  { name: 'Sanduni Rathnayake', gender: 'female', age: 29, weight: 61, height: 165, bodyType: 'Athletic', goal: 'Strength', category: 'normal', monthsAgo: 6, attendanceRate: 0.7 },
  { name: 'Chamara Bandara', gender: 'male', age: 34, weight: 85, height: 180, bodyType: 'Muscular', goal: 'Strength', category: 'normal', monthsAgo: 6, attendanceRate: 0.8 },
  { name: 'Ishara Gunawardena', gender: 'female', age: 22, weight: 52, height: 160, bodyType: 'Slim', goal: 'Flexibility & mobility', category: 'cardio', monthsAgo: 1, attendanceRate: 0.45 },
  { name: 'Pradeep Kumara', gender: 'male', age: 45, weight: 88, height: 170, bodyType: 'Overweight', goal: 'General fitness', category: 'cardio', monthsAgo: 2, health: 'Controlled hypertension', attendanceRate: 0.4 },
  { name: 'Hasini Wijesekara', gender: 'female', age: 35, weight: 70, height: 168, bodyType: 'Average', goal: 'Endurance', category: 'personal_training', monthsAgo: 1, attendanceRate: 0.55 },
  { name: 'Lahiru Dissanayake', gender: 'male', age: 25, weight: 74, height: 176, bodyType: 'Athletic', goal: 'Muscle gain', category: 'normal', monthsAgo: 0, attendanceRate: 0.7 },
  { name: 'Thilini Senanayake', gender: 'female', age: 28, weight: 59, height: 163, bodyType: 'Average', goal: 'Weight loss', category: 'normal', monthsAgo: 0, attendanceRate: 0.6 },
];

const CHARTS = [
  {
    title: 'Beginner Chest Day',
    category: 'chest',
    description: 'Build a strong foundation for the chest and triceps. Warm up 10 minutes on the treadmill first.',
    exercises: [
      { name: 'Flat Barbell Bench Press', sets: 4, reps: '10-12', restTime: '90 sec', notes: 'Keep shoulder blades retracted, feet flat' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '12', restTime: '75 sec', notes: '30° bench angle' },
      { name: 'Pec Deck Fly', sets: 3, reps: '15', restTime: '60 sec' },
      { name: 'Push-ups', sets: 3, reps: 'Till failure', restTime: '60 sec' },
      { name: 'Cable Triceps Pushdown', sets: 3, reps: '12-15', restTime: '60 sec' },
    ],
  },
  {
    title: 'Leg Day Power',
    category: 'legs',
    description: 'Compound-focused lower body session for strength and size.',
    exercises: [
      { name: 'Barbell Back Squat', sets: 5, reps: '5', restTime: '2 min', notes: 'Hit parallel depth, brace core' },
      { name: 'Romanian Deadlift', sets: 4, reps: '8', restTime: '90 sec' },
      { name: 'Leg Press', sets: 3, reps: '12', restTime: '90 sec' },
      { name: 'Walking Lunges', sets: 3, reps: '12 each leg', restTime: '60 sec' },
      { name: 'Seated Calf Raise', sets: 4, reps: '15-20', restTime: '45 sec' },
    ],
  },
  {
    title: 'Fat Burn Cardio Circuit',
    category: 'cardio',
    description: 'High-energy circuit to boost endurance and burn calories. Complete all rounds.',
    exercises: [
      { name: 'Treadmill Incline Walk', sets: 1, reps: '10 min', restTime: '—', notes: 'Incline 8-10%, speed 5 km/h' },
      { name: 'Rowing Machine Sprint', sets: 5, reps: '250 m', restTime: '60 sec' },
      { name: 'Battle Ropes', sets: 4, reps: '30 sec', restTime: '30 sec' },
      { name: 'Jump Rope', sets: 4, reps: '1 min', restTime: '30 sec' },
      { name: 'Stationary Bike Intervals', sets: 6, reps: '20 sec sprint', restTime: '40 sec easy' },
    ],
  },
  {
    title: 'Full Body Starter',
    category: 'full_body',
    description: 'Three days a week full-body routine for new members.',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: '12', restTime: '60 sec' },
      { name: 'Lat Pulldown', sets: 3, reps: '12', restTime: '60 sec' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10', restTime: '60 sec' },
      { name: 'Seated Cable Row', sets: 3, reps: '12', restTime: '60 sec' },
      { name: 'Plank', sets: 3, reps: '45 sec', restTime: '30 sec' },
    ],
  },
  {
    title: 'Back & Biceps Builder',
    category: 'back',
    description: 'Width and thickness for the back, finished with bicep isolation.',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '6', restTime: '2 min', notes: 'Neutral spine — film your form' },
      { name: 'Pull-ups', sets: 4, reps: '8-10', restTime: '90 sec', notes: 'Use assisted machine if needed' },
      { name: 'Bent-over Barbell Row', sets: 3, reps: '10', restTime: '75 sec' },
      { name: 'Barbell Curl', sets: 3, reps: '12', restTime: '60 sec' },
      { name: 'Hammer Curl', sets: 3, reps: '12', restTime: '60 sec' },
    ],
  },
] as const;

async function seedAdmin() {
  const email = 'admin@gym.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✔ Admin already exists (${email})`);
    return existing;
  }
  const admin = await User.create({
    name: 'Gym Admin',
    email,
    password: await bcrypt.hash('admin123', 12),
    phone: '+94 77 000 0000',
    address: 'Power Zone Gym, Colombo',
    age: 35,
    gender: 'male',
    weight: 80,
    height: 178,
    bodyType: 'Athletic',
    fitnessGoal: 'General fitness',
    membershipCategory: 'normal',
    role: 'admin',
    isActive: true,
  });
  console.log(`✔ Created admin: ${email} / admin123`);
  return admin;
}

async function seedSampleData(adminId: mongoose.Types.ObjectId) {
  const memberCount = await User.countDocuments({ role: 'member' });
  if (memberCount > 0) {
    console.log(`ℹ ${memberCount} members already exist — skipping sample data (use --reset to start fresh).`);
    return;
  }

  await Settings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', pricing: { ...MEMBERSHIP_PRICING } } },
    { upsert: true },
  );
  const pricing = { ...MEMBERSHIP_PRICING };
  const password = await bcrypt.hash('member123', 12);
  const now = new Date();
  const today = startOfDay(now);

  // Workout charts
  const charts = await WorkoutChart.insertMany(
    CHARTS.map((c) => ({ ...c, exercises: c.exercises.map((e) => ({ ...e })), createdBy: adminId, assignedTo: [] })),
  );
  console.log(`✔ Created ${charts.length} workout charts`);

  let paymentCount = 0;
  let attendanceCount = 0;

  for (const [i, m] of SAMPLE_MEMBERS.entries()) {
    const first = m.name.split(' ')[0].toLowerCase();
    const registered = subDays(subMonths(now, m.monthsAgo), Math.floor(rand() * 20));
    const startWeight = Math.round((m.weight + (m.goal === 'Weight loss' ? 3 : -1.5)) * 10) / 10;

    const user = await User.create({
      name: m.name,
      email: `${first}@example.com`,
      password,
      phone: `+94 7${Math.floor(rand() * 9)} ${String(Math.floor(rand() * 900) + 100)} ${String(Math.floor(rand() * 9000) + 1000)}`,
      address: `${Math.floor(rand() * 200) + 1} ${pick(['Galle Road', 'Kandy Road', 'Duplication Road', 'Baseline Road', 'High Level Road'])}, ${pick(['Colombo', 'Dehiwala', 'Nugegoda', 'Rajagiriya', 'Kotte'])}`,
      age: m.age,
      gender: m.gender,
      weight: m.weight,
      height: m.height,
      bodyType: m.bodyType,
      fitnessGoal: m.goal,
      healthConditions: m.health ?? '',
      membershipCategory: m.category,
      registeredDate: registered,
      role: 'member',
      isActive: true,
      weightHistory:
        m.monthsAgo > 0
          ? [
              { weight: startWeight, date: registered },
              { weight: Math.round(((startWeight + m.weight) / 2) * 10) / 10, date: addDays(registered, 30) },
              { weight: m.weight, date: subDays(now, 5) },
            ]
          : [{ weight: m.weight, date: registered }],
    });

    // Assign charts to most members
    if (i % 4 !== 3) {
      const chart =
        m.category === 'cardio' || m.goal === 'Weight loss'
          ? charts[2]
          : m.monthsAgo <= 1
            ? charts[3]
            : charts[i % 2 === 0 ? 0 : 4];
      await WorkoutChart.updateOne({ _id: chart._id }, { $addToSet: { assignedTo: user._id } });
      user.assignedChart = chart._id;
      await user.save();
    }

    // Payments: one record per month since registration
    const payments = [];
    for (let back = m.monthsAgo; back >= 0; back--) {
      const d = subMonths(now, back);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const isCurrent = back === 0;
      const roll = rand();
      let status: 'paid' | 'pending' | 'overdue';
      if (isCurrent) status = roll < 0.55 ? 'paid' : 'pending';
      else status = roll < 0.88 ? 'paid' : 'overdue';

      const method = rand() < 0.5 ? 'cash' : 'online';
      const paidAt = isCurrent ? subDays(now, Math.floor(rand() * Math.max(now.getDate() - 1, 1))) : new Date(year, month - 1, 2 + Math.floor(rand() * 10), 10);
      payments.push({
        member: user._id,
        amount: pricing[m.category],
        month,
        year,
        paymentStatus: status,
        ...(status === 'paid'
          ? {
              paymentMethod: method,
              paidAt,
              ...(method === 'cash'
                ? { markedBy: adminId, markedAt: paidAt }
                : { stripePaymentId: `pi_demo_${user._id.toString().slice(-6)}${month}`, stripeSessionId: `cs_demo_${user._id.toString().slice(-6)}${month}` }),
            }
          : {}),
      });
    }
    await Payment.insertMany(payments);
    paymentCount += payments.length;

    // Attendance for the last ~60 days (since registration)
    const records = [];
    const from = startOfDay(registered > subDays(now, 60) ? registered : subDays(now, 60));
    for (let day = from; day <= today; day = addDays(day, 1)) {
      const isToday = day.getTime() === today.getTime();
      const sunday = day.getDay() === 0;
      if (rand() > m.attendanceRate * (sunday ? 0.4 : 1)) continue;
      const hour = pick([5, 6, 6, 7, 7, 8, 12, 17, 18, 18, 19, 20]);
      const checkIn = new Date(day);
      checkIn.setHours(hour, Math.floor(rand() * 60), 0, 0);
      if (isToday && checkIn > now) continue;
      records.push({ member: user._id, date: day, checkInTime: checkIn });
    }
    if (records.length) await Attendance.insertMany(records);
    attendanceCount += records.length;
  }

  console.log(`✔ Created ${SAMPLE_MEMBERS.length} members (password: member123)`);
  console.log(`✔ Created ${paymentCount} payment records`);
  console.log(`✔ Created ${attendanceCount} attendance records`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✖ MONGODB_URI is not set. Add it to .env.local');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✔ Connected to MongoDB');

  // Make sure indexes (incl. unique constraints) exist before inserting.
  await Promise.all([User.syncIndexes(), Payment.syncIndexes(), Attendance.syncIndexes(), WorkoutChart.syncIndexes(), Settings.syncIndexes()]);

  if (RESET) {
    await Promise.all([User.deleteMany({}), Payment.deleteMany({}), Attendance.deleteMany({}), WorkoutChart.deleteMany({}), Settings.deleteMany({})]);
    console.log('✔ Cleared all collections');
  }

  const admin = await seedAdmin();
  if (!ADMIN_ONLY) await seedSampleData(admin._id);

  await mongoose.disconnect();
  console.log('\n🏋️  Seed complete. Sign in at http://localhost:3000/login');
}

main().catch(async (err) => {
  console.error('✖ Seed failed:', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
