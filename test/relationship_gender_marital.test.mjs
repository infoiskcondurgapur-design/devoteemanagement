import { test } from 'node:test';
import assert from 'node:assert/strict';
import { devoteeSchema } from '../src/pages/devotees/devoteeSchema.js';

// Helper function mirroring the form logic in PersonalDetailsStep
function getRelationshipOptions(gender) {
    if (gender === 'Female') return ['Father', 'Husband'];
    if (gender === 'Male') return ['Father', 'Wife'];
    return ['Father', 'Husband', 'Wife'];
}

function resolveRelationshipAndMaritalStatus(gender, relationType, currentMaritalStatus = 'Single') {
    const validOptions = getRelationshipOptions(gender);
    let resolvedRel = relationType;
    if (!validOptions.includes(resolvedRel)) {
        resolvedRel = 'Father';
    }
    let resolvedMarital = currentMaritalStatus;
    if (resolvedRel === 'Husband' || resolvedRel === 'Wife') {
        resolvedMarital = 'Married';
    }
    return {
        options: validOptions,
        relationType: resolvedRel,
        maritalStatus: resolvedMarital
    };
}

test('When Gender is Female, relationship options are Father & Husband', () => {
    const options = getRelationshipOptions('Female');
    assert.deepEqual(options, ['Father', 'Husband']);
    assert.equal(options.includes('Wife'), false);
    assert.equal(options.length, 2);
});

test('When Gender is Male, relationship options are Father & Wife', () => {
    const options = getRelationshipOptions('Male');
    assert.deepEqual(options, ['Father', 'Wife']);
    assert.equal(options.includes('Husband'), false);
    assert.equal(options.length, 2);
});

test('When Relationship is Husband, Marital Status automatically becomes Married', () => {
    const result = resolveRelationshipAndMaritalStatus('Female', 'Husband', 'Single');
    assert.equal(result.relationType, 'Husband');
    assert.equal(result.maritalStatus, 'Married');
});

test('When Relationship is Wife, Marital Status automatically becomes Married', () => {
    const result = resolveRelationshipAndMaritalStatus('Male', 'Wife', 'Single');
    assert.equal(result.relationType, 'Wife');
    assert.equal(result.maritalStatus, 'Married');
});

test('Switching Gender from Male (Wife) to Female resets relationship to Father or valid option', () => {
    const result = resolveRelationshipAndMaritalStatus('Female', 'Wife', 'Married');
    assert.deepEqual(result.options, ['Father', 'Husband']);
    assert.equal(result.relationType, 'Father');
});

test('Switching Gender from Female (Husband) to Male resets relationship to Father or valid option', () => {
    const result = resolveRelationshipAndMaritalStatus('Male', 'Husband', 'Married');
    assert.deepEqual(result.options, ['Father', 'Wife']);
    assert.equal(result.relationType, 'Father');
});

test('DevoteeSchema validates both Female (Husband) and Male (Wife) payloads with Married status', () => {
    const femalePayload = {
        name: 'Radha Devi Dasi',
        gender: 'Female',
        relationType: 'Husband',
        guardianName: 'Gouranga Das',
        maritalStatus: 'Married',
        contact: '9876543210',
        spiritualStatus: 'Initiated'
    };
    const validFemale = devoteeSchema.safeParse(femalePayload);
    assert.equal(validFemale.success, true);

    const malePayload = {
        name: 'Gouranga Das',
        gender: 'Male',
        relationType: 'Wife',
        guardianName: 'Radha Devi Dasi',
        maritalStatus: 'Married',
        contact: '9876543211',
        spiritualStatus: 'Initiated'
    };
    const validMale = devoteeSchema.safeParse(malePayload);
    assert.equal(validMale.success, true);
});
