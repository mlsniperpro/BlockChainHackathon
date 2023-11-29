import {
    Record,
    $query,
    ic,
    $update,
    nat64,
    Opt,
    Variant,
    Result,
    match,
    StableBTreeMap,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the structure of a Student record
type Student = Record<{
    id: string;
    motherName: string;
    fatherName: string;
    firstName: string;
    lastName: string;
    ageAtRegistration: nat64;
    class: string;
    schoolId: Opt<string>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

// Define the structure of a StudentPayload
type StudentPayload = Record<{
    motherName: string;
    fatherName: string;
    firstName: string;
    lastName: string;
    ageAtRegistration: nat64;
    class: string;
    schoolId: Opt<string>;
}>;

// Define the structure of a User record
type User = Record<{
    userId: string;
    username: string;
    passwordHash: string; // Storing hash instead of plain password
    role: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

// Define the structure of a UserPayload
type UserPayload = Record<{
    username: string;
    passwordHash: string; // Storing hash instead of plain password
    role: string;
}>;

// Error types for the system
type Error = Variant<{
    NotFound: string;
    InvalidID: string;
    InvalidPayload: string; // Changed from 'InvaluserIdPayload'
    Unauthorized: string;
    DuplicateRecord: string;
    InvalidCredentials: string; // Changed from 'InvaluserIdCredentials'
}>;

// Storage for students and users
const studentStorage = new StableBTreeMap<string, Student>(0, 44, 1024);
const userStorage = new StableBTreeMap<string, User>(1, 44, 1024);

// Update function to register a new user
$update;
export function registerUser(payload: UserPayload): Result<User, Error> {
    try {
        // Validate payload
        if (!payload || typeof payload !== "object") {
            return Result.Err<User, Error>({ InvalidPayload: "Invalid payload for registering user" });
        }

        // Validate payload properties
        if (!payload.username || !payload.passwordHash || !payload.role) {
            return Result.Err<User, Error>({ InvalidPayload: "Invalid payload properties for registering user" });
        }

        // Generate a new user record
        const user: User = {
            userId: uuidv4(),
            username: payload.username,
            passwordHash: payload.passwordHash,
            role: payload.role,
            createdAt: ic.time(),
            updatedAt: Opt.None,
        };

        // Insert user into storage
        userStorage.insert(user.username, user);

        // Return successful result
        return Result.Ok(user);
    } catch (error) {
        // Handle unexpected errors
        return Result.Err<User, Error>({ NotFound: `Failed to register user: ${error}` });
    }
}

// Update function to add a new student record
$update;
export function addStudentRecord(payload: StudentPayload): Result<Student, Error> {
    try {
        // Validate payload
        if (!payload || typeof payload !== "object") {
            return Result.Err<Student, Error>({ InvalidPayload: "Invalid payload for adding student record" });
        }

        // Validate payload properties
        if (!payload.motherName || !payload.fatherName || !payload.firstName || !payload.lastName || !payload.ageAtRegistration || !payload.class) {
            return Result.Err<Student, Error>({ InvalidPayload: "Invalid payload properties for adding student record" });
        }

        // Generate a new student record
        const student: Student = {
            id: uuidv4(),
            motherName: payload.motherName,
            fatherName: payload.fatherName,
            firstName: payload.firstName,
            lastName: payload.lastName,
            ageAtRegistration: payload.ageAtRegistration,
            class: payload.class,
            schoolId: payload.schoolId,
            createdAt: ic.time(),
            updatedAt: Opt.None,
        };

        // Insert student into storage
        studentStorage.insert(student.id, student);

        // Return successful result
        return Result.Ok(student);
    } catch (error) {
        // Handle unexpected errors
        return Result.Err<Student, Error>({ NotFound: `Failed to add student record: ${error}` });
    }
}

// Query function to log in a user
$query;
export function loginUser(username: string, password: string): Result<string, Error> {
    const userRef = userStorage.get(username);

    return match(userRef, {
        Some: (user) => {
            if (user.passwordHash === password) {
                return Result.Ok<string, Error>(user.userId);
            } else {
                return Result.Err<string, Error>({ InvalidCredentials: "Invalid credentials" });
            }
        },
        None: () => Result.Err<string, Error>({ NotFound: `User with username ${username} not found` }),
    });
}


// Query function to get details of a student
$query;
export function getStudentDetails(id: string): Result<Student, Error> {
    try {

        // Validate payload
        if (!id || typeof id !== "string") {
            return Result.Err<Student, Error>({ InvalidID: "Invalid ID" });
        }

        const studentRef = studentStorage.get(id);

        return match(studentRef, {
            Some: (student) => Result.Ok<Student, Error>(student),
            None: () => Result.Err<Student, Error>({ NotFound: `Student with Id ${id} not found` }),
        });
    } catch (error) {
        // Handle unexpected errors
        return Result.Err<Student, Error>({ NotFound: `Failed to get student details: ${error}` });
    }
}

// Update function to delete a student record
$update;
export function deleteStudentRecord(id: string): Result<string, Error> {
    try {

        // Validate payload
        if (!id || typeof id !== "string") {
            return Result.Err<string, Error>({ InvalidID: "Invalid ID" });
        }
        const studentRef = studentStorage.remove(id);

        return match(studentRef, {
            Some: () => Result.Ok<string, Error>(`Successfully deleted student with Id ${id}`),
            None: () => Result.Err<string, Error>({ NotFound: `Student with Id ${id} not found` }),
        });
    } catch (error) {
        // Handle unexpected errors
        return Result.Err<string, Error>({ NotFound: `Failed to delete student record: ${error}` });
    }
}

// A workaround to make uuid package work with Azle
globalThis.crypto = {
    //@ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
