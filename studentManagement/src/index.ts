import {
  Canister,
  Record,
  query,
  ic,
  update,
  text,
  nat64,
  Opt,
  Variant,
  Result,
  None,
  Void,
  Ok,
  Err,
  StableBTreeMap,
  Vec,
} from "azle";
import { v4 as uuidv4 } from "uuid";
import {
  hashPassword,
  verifyPassword,
  isAdmin,
  isSchoolAdmin,
} from "./auth_utils"; // Hypothetical utility functions

// Define record types for the system
const StudentRecord = Record({
  motherId: text,
  fatherId: text,
  firstName: text,
  lastName: text,
  ageAtRegistration: nat64,
  class: text,
  schoolId: Opt(text),
});

const Student = Record({
  upi: text,
  motherId: text,
  fatherId: text,
  firstName: text,
  lastName: text,
  ageAtRegistration: nat64,
  class: text,
  schoolId: Opt(text),
  createdAt: nat64,
});

const User = Record({
  id: text,
  username: text,
  passwordHash: text, // Storing hash instead of plain password
  role: text,
});

// Error types for the system
const Error = Variant({
  NotFound: text,
  InvalidPayload: text,
  Unauthorized: text,
  DuplicateRecord: text,
});

// Storage for students and users
const studentStorage = StableBTreeMap(text, Student, 0);
const userStorage = StableBTreeMap(text, User, 1);

// Canister interface
export default Canister({
  registerUser: update([User,text], Result(User, Error), (payload, password) => {
    const userRef = userStorage.get(payload.username);
    if (userRef.Some) {
      return Err({ DuplicateRecord: "User already exists" });
    }
    const user = {
      id: uuidv4(),
      username: payload.username,
      passwordHash: hashPassword(password), // Assuming hashPassword is a function that hashes passwords
      role: payload.role,
    };
    userStorage.insert(user.username, user);
    return Ok(user);
  }),

  loginUser: query([text, text], Result(text, Error), (username, password) => {
    const userRef = userStorage.get(username);
    if (userRef.None) {
      return Err({ NotFound: `User with username ${username} not found` });
    }
    const user = userRef.Some;
    if (!verifyPassword(password, user.passwordHash)) {
      // Assuming verifyPassword is a function that verifies passwords
      return Err({ InvalidPayload: "Invalid password" });
    }
    return Ok(user.id);
  }),

  addStudentRecord: update([StudentRecord], Result(text, Error), (payload) => {
    const student = {
      upi: uuidv4(),
      createdAt: ic.time(),
      ...payload,
    };
    studentStorage.insert(student.upi, student);
    return Ok(student.upi);
  }),

  getStudentDetails: query(
    [text],
    Result(StudentRecord, Error),
    (upi) => {
      const studentRef = studentStorage.get(upi);
      if ("None" in studentRef) {
        return Err({ NotFound: `Student with UPI ${upi} not found` });
      }
      const student = studentRef.Some;
      return Ok(student);
    }
  ),

  deleteStudentRecord: update([text], Result(text, Error), (upi) => {
    const studentRef = studentStorage.remove(upi);
    if (studentRef.None) {
      return Err({ NotFound: `Student with UPI ${upi} not found` });
    }
    return Ok(`Successfully deleted student with UPI ${upi}`);
  }),

  assignStudentToSchool: update(
    [text, text],
    Result(text, Error),
    (upi, schoolId) => {
      const studentRef = studentStorage.get(upi);
      if (studentRef.None) {
        return Err({ NotFound: `Student with UPI ${upi} not found` });
      }
      const student = {
        ...studentRef.Some,
        schoolId: Opt(schoolId), // Wrapping schoolId in Opt
      };
      studentStorage.insert(upi, student);
      return Ok(`Successfully added the student with the UPI number ${upi} to school with ID ${schoolId}`);
    }
  ),

  getAllStudents: query([], Result(Vec(Student), Error), () => {
    return Ok(studentStorage.values());
  }),
});
