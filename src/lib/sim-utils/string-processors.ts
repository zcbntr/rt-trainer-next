/**
 * Splits a number into two halves and pads them with zeros to make sure they are the same length
 * @param input - number to split
 * @returns - tuple containing the two halves of the number
 */
export function splitAndPadNumber(input: number): [number, number] {
	const numberString = input.toString();
	const halfLength = Math.ceil(numberString.length / 2);
	const firstHalf = parseInt(numberString.padEnd(halfLength, '0').slice(0, halfLength));
	const secondHalf = parseInt(numberString.slice(halfLength).padEnd(halfLength, '0'));
	return [firstHalf, secondHalf];
}

/* Returns a lower copy of the string with single length spaces and no punctuation. */
export function processString(str: string): string {
	return trimSpaces(removePunctuationExceptDeciamlPointAndHyphen(str.toLowerCase()));
}

/* Removes most punctionation from a string */
export function removePunctuationExceptDeciamlPointAndHyphen(str: string): string {
	return str.replace(/(?<=\d),(?=\d)|[^\d\w\s.-]/g, ' ');
}

/* Removes all punctuation from a string */
export function removePunctuation(str: string): string {
	return str.replace(/[^\d\w\s]/g, ' ');
}

/* Adds spaces between each character */
export function addSpacesBetweenCharacters(str: string): string {
	return str.split('').join(' ');
}

/* Shortens all spaces to a single space. */
export function trimSpaces(str: string): string {
	return str.replace(/\s+/g, ' ');
}

/* Removes all digits from a string. */
export function removeDigits(str: string): string {
	return str.replace(/[0-9]/g, '');
}

export function swapDigitsWithWords(inputString: string): string {
	const digitWords: Record<string, string> = {
		'0': 'Zero ',
		'1': 'One ',
		'2': 'Two ',
		'3': 'Three ',
		'4': 'Four ',
		'5': 'Five ',
		'6': 'Six ',
		'7': 'Seven ',
		'8': 'Eight ',
		'9': 'Nine '
	};

	const result: string = inputString
		.split('')
		.map((char) => {
			if (/\d/.test(char)) {
				return digitWords[char];
			} else {
				return char;
			}
		})
		.join('');

	return result;
}