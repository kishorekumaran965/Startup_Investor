# TODO - Duplicate Value Handling

## Task
Edit the files so if a duplicate value is entered it will return "duplicate value is found" instead of returning an error.

## Plan
1. [ ] Add `existsByEmail(String email)` method to `UserRepositary.java`
2. [ ] Modify `UserServiceImpl.java` to check for duplicate email before saving
3. [ ] Add exception handling in `UserController.java` to return "duplicate value is found" message
4. [ ] Test the changes

## Progress
- Started: 2024
