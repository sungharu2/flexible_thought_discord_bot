import crypto from 'crypto';

export class LeftRight {
    readonly leftRight: string;
    readonly leftRightForEquip: string;
    readonly left: string;
    readonly right: string;
    readonly overload: string;
    readonly successRate: string;
    readonly leftSuccess: number;
    readonly rightSuccess: number;
    readonly overloadSuccess: number;
    readonly isLeftUpgradeFinished: boolean;
    readonly isRightUpgradeFinished: boolean;
    readonly isOverloadUpgradeFinished: boolean;
    readonly isEquipable: boolean;
    readonly isResetable: boolean;

    constructor(leftRight: string) {
        if (!(leftRight.length == 30 || leftRight.length == 32) ) {
            throw new Error('LeftRightError: leftRight length is not 30 or 32');
        }
        this.leftRight = leftRight;
        this.leftRightForEquip = leftRight.substring(0, 30);
        this.left = leftRight.substring(0, 10);
        this.right = leftRight.substring(10, 20);
        this.overload = leftRight.substring(20, 30);
        this.successRate = leftRight.substring(30, 32);

        this.leftSuccess = this.left.split('1').length - 1;
        this.rightSuccess = this.right.split('1').length - 1;
        this.overloadSuccess = this.overload.split('1').length - 1;

        this.isLeftUpgradeFinished = (this.left.indexOf('0') == -1);
        this.isRightUpgradeFinished = (this.right.indexOf('0') == -1);
        this.isOverloadUpgradeFinished = (this.overload.indexOf('0') == -1);
        this.isEquipable = this.isLeftUpgradeFinished && this.isRightUpgradeFinished && this.isOverloadUpgradeFinished;
        this.isResetable = !(this.left.substring(0, 1) == '0' && this.right.substring(0, 1) == '0');;
    }
    
    printLeftRightUI(printType: number): string {
        let brainLeftRight = '0000000000';
        // 좌뇌 파싱
        if (printType == 0) {
            brainLeftRight = this.left;
        } 
        // 우뇌 파싱
        if (printType == 1) {
            brainLeftRight = this.right;
        }
        // 과부하 파싱
        if (printType == 2) {
            brainLeftRight = this.overload;
        }

        let resultString = '';
        for (let i = 0; i < brainLeftRight.length; i++) {
            const char = brainLeftRight.charAt(i);
            if (char == '0') {
                resultString += '☆ ';
            }
            else if (char == '1') {
                if (printType == 2) {
                    resultString += '😈 ';
                }
                else{
                    resultString += '⭐ ';
                }
            }
            else if (char == '2') {
                resultString += '❌ ';
            }
        }
        return resultString;
    }
    
    printLeftRightInfo(printType: number): string {
        // return '(+6)[1등급]'
        if (printType == 0) {
            return '(+' + this.leftSuccess + ')[' + getLeftRightGradeBySuccess(this.leftSuccess) + '등급]';
        } 
        if (printType == 1) {
            return '(+' + this.rightSuccess + ')[' + getLeftRightGradeBySuccess(this.rightSuccess) + '등급]';
        } 
        if (printType == 2) {
            return '(+' + this.overloadSuccess + ')[' + getLeftRightGradeBySuccess(this.overloadSuccess) + '등급]';
        }
        return ''
    }
    
    getLeftRightStat(printType: number): string {
        if (printType == 0) {
            let leftGrade = getLeftRightGradeBySuccess(this.leftSuccess);
            if (leftGrade == 0) {
                return 'INT +0';
            }
            if (leftGrade == 1) {
                return 'INT +10';
            }
            if (leftGrade == 2) {
                return 'INT +20';
            }
            if (leftGrade == 3) {
                return 'INT +30';
            }
            if (leftGrade == 4) {
                return 'INT +40';
            }
        }    
        if (printType == 1) {
            let rightGrade = getLeftRightGradeBySuccess(this.rightSuccess);
            if (rightGrade == 0) {
                return 'INT +0%';
            }
            if (rightGrade == 1) {
                return 'INT +5%';
            }
            if (rightGrade == 2) {
                return 'INT +10%';
            }
            if (rightGrade == 3) {
                return 'INT +15%';
            }
            if (rightGrade == 4) {
                return 'INT +20%';
            }
        }
        if (printType == 2) {
            let overloadGrade = getLeftRightGradeBySuccess(this.overloadSuccess);
            if (overloadGrade == 0) {
                return 'INT -0%';
            }
            if (overloadGrade == 1) {
                return 'INT -4%';
            }
            if (overloadGrade == 2) {
                return 'INT -8%';
            }
            if (overloadGrade == 3) {
                return 'INT -12%';
            }
            if (overloadGrade == 4) {
                return 'INT -16%';
            }
        }
        return '';
    }
}

export function upgradeLeftRight(oldLeftRight: LeftRight, upgradeType: number): [LeftRight, boolean | null] {
    // 모든 강화 완료
    if (oldLeftRight.isLeftUpgradeFinished && oldLeftRight.isRightUpgradeFinished &&  oldLeftRight.isOverloadUpgradeFinished ) {
        return [oldLeftRight, null];
    }

    const rand = generateRandomNumber(100);
    const successRate = Number.parseInt(oldLeftRight.successRate);
    //console.log('rand: ' + rand);
    //console.log('successRate: ' + successRate);
    // 좌뇌 활성화
    if (upgradeType == 0) {
        const upgradeIndex = oldLeftRight.left.indexOf('0');
        // 좌뇌 모든 활성화 완료
        if (upgradeIndex == -1) {
            return [oldLeftRight, null];
        }
        // 활성화 성공
        if (rand < successRate) {
            const newSuccessRate = successRate >= 35 ? successRate - 10 : successRate;
            return [new LeftRight(oldLeftRight.left.replace('0', '1') + oldLeftRight.right + oldLeftRight.overload + newSuccessRate), true];    
        } 
        // 활성화 실패
        else {
            const newSuccessRate = successRate <= 65 ? successRate + 10 : successRate;
            return [new LeftRight(oldLeftRight.left.replace('0', '2') + oldLeftRight.right + oldLeftRight.overload + newSuccessRate), false];   
        }
    } 
    // 우뇌 활성화
    if (upgradeType == 1) {
        const upgradeIndex = oldLeftRight.right.indexOf('0');
        // 우뇌 모든 활성화 완료
        if (upgradeIndex == -1) {
            return [oldLeftRight, null];
        }
        // 활성화 성공
        if (rand < successRate) {
            const newSuccessRate = successRate >= 35 ? successRate - 10 : successRate;
            return [new LeftRight(oldLeftRight.left + oldLeftRight.right.replace('0', '1') + oldLeftRight.overload + newSuccessRate), true];   
        } 
        // 활성화 실패
        else {
            const newSuccessRate = successRate <= 65 ? successRate + 10 : successRate;
            return [new LeftRight(oldLeftRight.left + oldLeftRight.right.replace('0', '2') + oldLeftRight.overload + newSuccessRate), false];   
        }
    }
    // 과부하 활성화
    if (upgradeType == 2) {
        const upgradeIndex = oldLeftRight.overload.indexOf('0');
        // 과부하 모든 활성화 완료
        if (upgradeIndex == -1) {
            return [oldLeftRight, null];
        }
        // 활성화 성공
        if (rand < successRate) {
            const newSuccessRate = successRate >= 35 ? successRate - 10 : successRate;
            return [new LeftRight(oldLeftRight.left + oldLeftRight.right + oldLeftRight.overload.replace('0', '1') + newSuccessRate), true];   
        } 
        // 활성화 실패
        else {
            const newSuccessRate = successRate <= 65 ? successRate + 10 : successRate;
            return [new LeftRight(oldLeftRight.left + oldLeftRight.right + oldLeftRight.overload.replace('0', '2') + newSuccessRate), false];   
        }
    }
    return [oldLeftRight, null];
}

function getLeftRightGradeBySuccess(success: number): number {
    if (success >= 10) {
        return 4;
    }
    if (success >= 9) {
        return 3;
    }
    if (success >= 7) {
        return 2;
    }
    if (success >= 6) {
        return 1;
    }
    return 0;
}

function generateRandomNumber(max: number) {
    return crypto.randomInt(0, max);
}

type LeftRightData = {
    addStat: number,
    multStat: number,
    minusMultStat: number,
}
export function getLeftRightData(leftRight: LeftRight): LeftRightData {
    const addStat = Number.parseInt(leftRight.getLeftRightStat(0).replace('INT +', ''));
    const multStat = Number.parseInt(leftRight.getLeftRightStat(1).replace('INT +', '').replace('%', ''));
    const minusMultStat = Number.parseInt(leftRight.getLeftRightStat(2).replace('INT -', '').replace('%', ''));

    return {
        addStat: addStat,
        multStat: multStat,
        minusMultStat: minusMultStat,
    }
}