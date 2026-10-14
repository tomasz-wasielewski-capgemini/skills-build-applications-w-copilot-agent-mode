import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: string;
    teamId?: string;
    type?: unknown;
    minutes?: unknown;
  };

  if (!userId || !teamId || typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity requires userId, teamId, and type'), { status: 400 });
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    throw Object.assign(new Error('Activity minutes must be a positive number'), { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid Mongo ObjectIds'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity userId and teamId must reference existing records'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: numericMinutes,
    points: numericMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject ? activity.toObject() : activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  if (members !== undefined && !Array.isArray(members)) {
    throw Object.assign(new Error('Team members must be an array of user IDs'), { status: 400 });
  }

  const normalizedMembers = (members ?? []).map((member) => {
    if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) {
      throw Object.assign(new Error('Each team member must be a valid Mongo ObjectId'), { status: 400 });
    }
    return member;
  });

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team.toObject ? team.toObject() : team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNameById = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNameById.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail?.trim();
  if (!email) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).lean();
  const focusByActivityType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    swim: 'endurance',
    walk: 'mobility',
    strength: 'strength',
    yoga: 'mobility',
  };

  const preferredFocus = recentActivity?.type ? focusByActivityType[String(recentActivity.type).toLowerCase()] ?? String(user.fitnessGoal ?? '').toLowerCase() : String(user.fitnessGoal ?? '').toLowerCase();
  const workouts = await Workout.find().lean();
  const ordered = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      const matchesActivity = recentActivity && focus === preferredFocus;
      const matchesGoal = focus === String(user.fitnessGoal ?? '').toLowerCase();
      const reason = matchesActivity
        ? `Matches your ${String(recentActivity.type).toLowerCase()} activity and ${preferredFocus} focus`
        : matchesGoal
          ? `Supports your ${user.fitnessGoal} goal`
          : `Builds on your ${String(user.fitnessGoal ?? 'fitness')} plan`;
      return { ...workout, reason, _score: matchesActivity ? 2 : matchesGoal ? 1 : 0 };
    })
    .filter((workout) => workout.focus && (workout.focus.toLowerCase() === preferredFocus || workout.focus.toLowerCase() === String(user.fitnessGoal ?? '').toLowerCase()))
    .sort((left, right) => right._score - left._score);

  if (ordered.length > 0) {
    return ordered;
  }

  return workouts.slice(0, 1).map((workout) => ({
    ...workout,
    reason: `Builds on your ${String(user.fitnessGoal ?? 'fitness')} routine`,
  }));
}

export { User };
