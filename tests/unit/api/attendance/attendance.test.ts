jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

const mockSave = jest.fn();
const mockAttendance = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
};

jest.mock('@/models/Attendance', () => ({
    Attendance: mockAttendance,
}));
jest.mock('@/models/Academic', () => ({
    Assignment: { find: jest.fn() },
}));

describe('Attendance Actions', () => {
    let markAttendance: any, updateStudentAttendance: any, lockAttendance: any;

    beforeAll(async () => {
        const mod = await import('@/actions/attendance');
        markAttendance = mod.markAttendance;
        updateStudentAttendance = mod.updateStudentAttendance;
        lockAttendance = mod.lockAttendance;
    });

    beforeEach(() => jest.clearAllMocks());

    // --- markAttendance ---
    test('markAttendance: locked record → rejected', async () => {
        mockAttendance.findOne.mockResolvedValue({ is_locked: true });
        const result = await markAttendance({
            date: '2026-01-15', subject: 's1', section: 'A', students: [],
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('locked');
    });

    test('markAttendance: existing unlocked → updates', async () => {
        const existing = { is_locked: false, records: [], save: mockSave };
        mockAttendance.findOne.mockResolvedValue(existing);
        const result = await markAttendance({
            date: '2026-01-15', subject: 's1', section: 'A',
            students: [{ student_id: 'st1', status: 'present' }],
        });
        expect(result.success).toBe(true);
        expect(result.message).toContain('updated');
        expect(mockSave).toHaveBeenCalled();
    });

    test('markAttendance: no existing record → creates new', async () => {
        mockAttendance.findOne.mockResolvedValue(null);
        mockAttendance.create.mockResolvedValue({});
        const result = await markAttendance({
            date: '2026-01-15', subject: 's1', section: 'A',
            teacher: 't1', session: 'ses1', batch: 'b1',
            students: [{ student_id: 'st1', status: 'present' }],
        });
        expect(result.success).toBe(true);
        expect(result.message).toContain('marked');
        expect(mockAttendance.create).toHaveBeenCalled();
    });

    // --- updateStudentAttendance ---
    test('updateStudentAttendance: not found → error', async () => {
        mockAttendance.findById.mockResolvedValue(null);
        const result = await updateStudentAttendance('bad_id', 'st1', 'present');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    test('updateStudentAttendance: locked → rejected', async () => {
        mockAttendance.findById.mockResolvedValue({ is_locked: true });
        const result = await updateStudentAttendance('a1', 'st1', 'present');
        expect(result.success).toBe(false);
        expect(result.error).toContain('locked');
    });

    test('updateStudentAttendance: success', async () => {
        const studentRecord = { student: { toString: () => 'st1' }, status: 'absent' };
        mockAttendance.findById.mockResolvedValue({
            is_locked: false,
            records: [studentRecord],
            save: mockSave,
        });
        const result = await updateStudentAttendance('a1', 'st1', 'present');
        expect(result.success).toBe(true);
        expect(studentRecord.status).toBe('present');
        expect(mockSave).toHaveBeenCalled();
    });

    // --- lockAttendance ---
    test('lockAttendance: lock operation', async () => {
        mockAttendance.updateMany.mockResolvedValue({});
        const result = await lockAttendance(['a1', 'a2'], 'lock');
        expect(result.success).toBe(true);
        expect(mockAttendance.updateMany).toHaveBeenCalledWith(
            { _id: { $in: ['a1', 'a2'] } },
            { $set: { is_locked: true } }
        );
    });

    test('lockAttendance: unlock operation', async () => {
        mockAttendance.updateMany.mockResolvedValue({});
        const result = await lockAttendance(['a1'], 'unlock');
        expect(result.success).toBe(true);
        expect(mockAttendance.updateMany).toHaveBeenCalledWith(
            { _id: { $in: ['a1'] } },
            { $set: { is_locked: false } }
        );
    });
});
