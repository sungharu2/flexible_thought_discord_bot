import { LeftRight, getLeftRightData } from '../../brain_upgrade/upgrade.leftright.js';
import { getNeuronDataByLv } from '../../brain_upgrade/upgrade.neuron.js';
import { getPotentialData, initBrainPotential } from '../../brain_upgrade/upgrade.potential.js';
import { insertNewLog } from '../log/log.service.js';
import { decreaseSynapse, findBrainById, findBrainIqTop10ByServer, findBrainLevelTop10ByServer, findBrainNeuronTop10ByServer, insertBrainIfNotExists, updateAllIsEvolvedFalse, updateEvolveBrain, updateIq, updateLeftRightEquip, updateLeftRightUpgrade, updateLevel, updateNeuron, updatePotential } from './brain.repository.js';
import type { Brain, BrainRow } from './brain.types.js';
import crypto from 'crypto';

function toBrain(row: BrainRow): Brain {
	return {
		discordUserId: row.discord_user_id,
		dtCreated: row.dt_created,
		dtModified: row.dt_modified,
		brLv: row.br_lv,
		brNeuronLv: row.br_neuron_lv,
		brPotential: row.br_potential,
		brIq: row.br_iq,
		brSynapse: row.br_synapse,
		brEvolved: row.br_evolved == 1 ? true : false,
		brLeftRightEquip: new LeftRight(row.br_left_right_equip),
		brLeftRightUpgrade: new LeftRight(row.br_left_right_upgrade),
	};
}

export async function getBrain(userId: string): Promise<Brain | null> {
	const row = await findBrainById(userId);
	if (!row) return null;

	return {
		discordUserId: row.discord_user_id,
		dtCreated: row.dt_created,
		dtModified: row.dt_modified,
		brLv: row.br_lv,
		brNeuronLv: row.br_neuron_lv,
		brPotential: row.br_potential,
		brIq: row.br_iq,
		brSynapse: row.br_synapse,
		brEvolved: row.br_evolved == 1 ? true : false,
		brLeftRightEquip: new LeftRight(row.br_left_right_equip),
		brLeftRightUpgrade: new LeftRight(row.br_left_right_upgrade),
	};
};

export async function getBrainTop10ByIq(serverId: string): Promise<Brain[]> {
	const rows = await findBrainIqTop10ByServer(serverId);

	return rows.map(toBrain);
};

export async function getBrainTop10ByNeuron(serverId: string): Promise<Brain[]> {
	const rows = await findBrainNeuronTop10ByServer(serverId);

	return rows.map(toBrain);
};

export async function getBrainTop10ByLevel(serverId: string): Promise<Brain[]> {
	const rows = await findBrainLevelTop10ByServer(serverId);

	return rows.map(toBrain);
};

export async function insertNewBrain(userId: string): Promise<boolean> {
	// 신규 생성 두뇌 잠재능력 초기화 로직
	const potential = initBrainPotential();
	const iq = getIq({
		brNeuronLv: 1,
		brPotential: potential,
		discordUserId: '',
		dtCreated: new Date(),
		dtModified: new Date(),
		brLv: 0,
		brIq: '',
		brSynapse: 1000,
		brEvolved: false,
		brLeftRightEquip: new LeftRight('00000000000000000000000000000075'),
		brLeftRightUpgrade: new LeftRight('00000000000000000000000000000075'),
	})

	return await insertBrainIfNotExists(userId, potential, iq);
};

export async function increaseLevel(userId: string, oldLevel: number, increaseLevel: number): Promise<boolean> {
	const newLevel = oldLevel + increaseLevel;
	const result = await updateLevel(userId, newLevel);

	// DB 로그 저장
	insertNewLog(userId, '6', oldLevel + '', newLevel + '');

	return result
};

export async function changeNeuron(userId: string, oldNeuron: number, newNeuron: number, curSynapse: number): Promise<boolean> {
	// 시냅스 사용
	const resultSynapse = await useSynapse(userId, curSynapse);
	if (!resultSynapse) return false;

	const result = await updateNeuron(userId, newNeuron);

	// DB 로그 저장
	insertNewLog(userId, '2', oldNeuron + '', newNeuron + '');

	return result
};

export async function changePotential(userId: string, oldPotential: string, newPotential: string, curSynapse: number): Promise<boolean> {
	// 시냅스 사용
	const resultSynapse = await useSynapse(userId, curSynapse);
	if (!resultSynapse) return false;

	const result = await updatePotential(userId, newPotential);

	// DB 로그 저장
	insertNewLog(userId, '4', oldPotential, newPotential);

	return result
};

export async function equipLeftRight(userId: string): Promise<boolean> {
	const brain = await getBrain(userId);
	const oldLeftRightEquip = brain?.brLeftRightEquip.leftRight || '';
	const newLeftRightForEquip = brain?.brLeftRightUpgrade.leftRightForEquip || '';

	const result = await updateLeftRightEquip(userId, newLeftRightForEquip);

	// DB 로그 저장
	insertNewLog(userId, '8', oldLeftRightEquip, newLeftRightForEquip);

	return result
};

export async function changeLeftRightUpgrade(userId: string, oldLeftRight: LeftRight, newLeftRight: LeftRight, curSynapse: number): Promise<boolean> {
	// 시냅스 사용
	const resultSynapse = await useSynapse(userId, curSynapse);
	if (!resultSynapse) return false;

	const result = await updateLeftRightUpgrade(userId, newLeftRight.leftRight);

	// DB 로그 저장
	insertNewLog(userId, '7', oldLeftRight.leftRight, newLeftRight.leftRight);

	return result
};
export async function resetLeftRightUpgrade(userId: string): Promise<boolean> {
	const brain = await getBrain(userId);
	const oldLeftRightUpgrade = brain?.brLeftRightUpgrade.leftRight || '000000000000000000000000000000';
	// 초기화
	const initLeftRight = '00000000000000000000000000000075';
	const result = await updateLeftRightUpgrade(userId, initLeftRight);

	// DB 로그 저장
	insertNewLog(userId, '9', oldLeftRightUpgrade, initLeftRight);

	return result
};

export async function evolveBrain(userId: string, oldLevel: number): Promise<boolean> {
	// 레벨 일정치 상승
	const newLevel = evolveLevelUp(oldLevel)
	//console.log(newLevel.increase);
	//console.log(newLevel.probabilities);
	const resultx = await increaseLevel(userId, oldLevel, newLevel.increase);

	const resulty = await updateEvolveBrain(userId);

	// DB 로그 저장
	insertNewLog(userId, '1', 'false', 'true');

	return resultx && resulty;
};


export async function resetIsEvolvedFalse(): Promise<boolean> {
	const result = await updateAllIsEvolvedFalse();

	// DB 로그 저장
	insertNewLog('admin', '5', '*', 'false');

	return result
};

export async function changeIq(brain: Brain): Promise<boolean> {
	const iq = getIq(brain)

	const result = await updateIq(brain.discordUserId, iq);

	return result
};

export async function useSynapse(userId: string, curSynapse: number): Promise<boolean> {
	if (curSynapse <= 0) {
		return false;
	}

	const result = await decreaseSynapse(userId);

	return result
};

export function getIq(brain: Brain): string {
	const neuronLv = brain.brNeuronLv;
	const potential = brain.brPotential;
	const leftRightEquip = brain.brLeftRightEquip;

	const neuronData = getNeuronDataByLv(neuronLv);
	const potentialData = getPotentialData(potential);
	const leftRightData = getLeftRightData(leftRightEquip);

	const baseInt = brain.brLv;
	const totalAddedInt = baseInt + neuronData.addStat + potentialData.addStat + leftRightData.addStat;
	const totalMultStat = (neuronData.multStat + potentialData.multStat + leftRightData.multStat) * (100 - leftRightData.minusMultStat) * 0.01;

	//console.log('baseInt: ' + baseInt);
	//console.log('neuronData.addStat: ' + neuronData.addStat);
	//console.log('potentialData.addStat: ' + potentialData.addStat);
	// console.log('leftRightData.addStat: ' + leftRightData.addStat);
	// console.log('leftRightData.multStat: ' + leftRightData.multStat);
	// console.log('leftRightData.minusMultStat: ' + leftRightData.minusMultStat);
	// console.log('totalAddedInt: ' + totalAddedInt);
	// console.log('totalMultStat: ' + totalMultStat + '%');

	return (totalAddedInt + totalAddedInt * (totalMultStat * 0.01)).toFixed(2) + '';
}

// 진화 시 레벨 상승
type LevelUpResult = {
	increase: number;
	probabilities: Record<number, number>;
};
function evolveLevelUp(level: number): LevelUpResult {
	type LevelUpResult = {
		increase: number;
		probabilities: Record<number, number>;
	};

	function randomPercent(): number {
		return crypto.randomInt(0, 1000000) / 10000;
	}

	function normalizeProbabilities(
		probs: Record<number, number>
	): Record<number, number> {

		const total = Object.values(probs)
			.reduce((a, b) => a + b, 0);

		const normalized: Record<number, number> = {};

		for (const key in probs) {
			normalized[Number(key)] =
				(probs[Number(key)] / total) * 100;
		}

		return normalized;
	}

	function generateLevelProbabilities(
		level: number
	): Record<number, number> {

		// 🔥 변경점 1
		// 초반 버프가 부드럽게 감소하도록 변경
		// exp 기반 감쇠 함수

		const earlyBoost =
			Math.exp(-level / 120);

		// 🔥 변경점 2
		// 실패 확률 증가를 완화
		// 기존보다 성장 유지

		const failRate =
			Math.min(
				28,
				Math.log10(level + 1) * 7
			);

		// 🔥 변경점 3
		// +5 / +10 초반 대폭 버프

		const probs: Record<number, number> = {

			0: failRate,

			1:
				22 +
				Math.log10(level + 10) * 3,

			2:
				24 -
				Math.log10(level + 10) * 1.5,

			3:
				22 +
				earlyBoost * 10,

			4:
				16 +
				earlyBoost * 12,

			// 🔥 크게 증가
			5:
				10 +
				earlyBoost * 14,

			// 🔥 크게 증가
			10:
				4 +
				earlyBoost * 10,
		};

		return normalizeProbabilities(probs);
	}

	function levelUp(
		currentLevel: number
	): LevelUpResult {

		const probs =
			generateLevelProbabilities(currentLevel);

		const rand = randomPercent();

		let cumulative = 0;

		for (const [increaseStr, probability]
			of Object.entries(probs)) {

			cumulative += probability;

			if (rand <= cumulative) {

				return {
					increase: Number(increaseStr),
					probabilities: probs,
				};
			}
		}

		return {
			increase: 0,
			probabilities: probs,
		};
	}

	return levelUp(level);
}