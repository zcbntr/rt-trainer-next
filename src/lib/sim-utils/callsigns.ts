export function isCallsignStandardRegistration(callsign: string): boolean {
	return callsign.length == 6 && callsign.charAt(1) == '-';
}

/* Returns a abbreviated callsign. Read up on this lol */
export function getAbbreviatedCallsign(
	scenarioSeed: number,
	aircraftType: string,
	callsign: string
): string {
	let abbreviatedCallsign = '';
	if (callsign.length == 6) {
		if (isCallsignStandardRegistration(callsign)) {
			// G-OFLY -> G-LY
			abbreviatedCallsign += callsign.charAt(0);
			abbreviatedCallsign += '-';
			abbreviatedCallsign += callsign.charAt(4);
			abbreviatedCallsign += callsign.charAt(5);
		} else {
			abbreviatedCallsign += callsign;
		}
	} else {
		const callsign_words: string[] = callsign.split(' ');
		abbreviatedCallsign += callsign_words[0];
	}

	return abbreviatedCallsign;
}