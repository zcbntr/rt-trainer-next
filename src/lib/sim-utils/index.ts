import { seedStringToNumber } from "../utils";

/**
 * Default coordinates for the map center
 */
export const wellesbourneMountfordCoords: [number, number] = [52.192, -1.614];

/**
 * Linear interpolation between two values
 * @param x - first value
 * @param y - second value
 * @param a - interpolation factor
 * @returns - interpolated value
 */
export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

/**
 * Generates a pseudo-random time of day in minutes based on a seed
 * @param seed - seed for the random number generator
 * @param min - minimum time in minutes 
 * @param max - maximum time in minutes 
 * @returns pseudo-random time in minutes
 */
export function getSeededTimeInMinutes(seed: number, min: number, max: number): number {
	return min + (seed % (max - min)) - max;
}

export function generateRandomURLValidString(length: number) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let randomString = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		randomString += charset.charAt(randomIndex);
	}

	return randomString;
}

export function getCompassDirectionFromHeading(heading: number) {
	const compassDirections = [
		'North',
		'North East',
		'East',
		'South East',
		'South',
		'South West',
		'West',
		'North West'
	];

	const index: number = Math.round(heading / 45) % 8;

	return compassDirections[index];
}

/**
 * Converts a number of minutes to a time string in the format HH:MM
 * @param minutes - number of minutes
 * @returns - time string in the format HH:MM
 * @throws - Error if the input is not a valid number representing time in minutes
 */
export function convertMinutesToTimeString(minutes: number): string {
	if (typeof minutes !== 'number' || minutes < 0 || minutes >= 24 * 60) {
		throw new Error('Invalid input. Please provide a valid number representing time in minutes.');
	}

	const hours = Math.floor(minutes / 60);
	const remainderMinutes = minutes % 60;

	const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
	const formattedMinutes = remainderMinutes < 10 ? `0${remainderMinutes}` : `${remainderMinutes}`;

	const timeString = `${formattedHours}:${formattedMinutes}`;
	return timeString;
}

/**
 * Gets a pseudo-random squawk code deterministically based on a seed and an airspace ID
 * @param seed - seed for the random number generator
 * @param airspaceId - ID of the airspace
 * @returns pseudo-random squawk code
 */
export function getRandomSqwuakCodeFromSeed(seed: number, airspaceId: string): string {
	const idHash = seedStringToNumber(airspaceId);
	let code = 0;
	for (let i = 0; i < 4; i++) {
		// Swap this out for a big prime
		code += ((seed * 5310545957 * i * idHash) % 8) * (10 ^ i);
	}
	return code.toString();
}

/**
 * Gets a pseudo-random frequency in the format XXX.XXX deterministically based on a seed and an object ID
 * @remarks Frequency range 118.000 -> 137.000
 * @param seed - seed for the random number generator
 * @param objectId - ID of the object
 * @returns pseudo-random frequency
 */
export function getRandomFrequencyFromSeed(seed: number, objectId: string): string {
	const idHash = seedStringToNumber(objectId);
	const prePointFrequency = (118 + ((7759 * seed * idHash) % 20)).toString();
	let afterPointFreq = (((7757 * seed * idHash) % 30) * 30).toString();
	if (afterPointFreq.length < 3) {
		afterPointFreq = afterPointFreq.padEnd(3, '0');
	}

	return `${prePointFrequency}.${afterPointFreq}`;
}