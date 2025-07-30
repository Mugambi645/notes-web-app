import { render, screen } from "@testing-library/react";
import Note from "./Note";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";


/*test("renders content", () => {
    const note = {
        content: 'Component testing is done with react-testing-library',
        important: true
    }

    render(<Note note={note} />)

    const element = screen.getByText('Component testing is done with react-testing-library')
  
    screen.debug(element)
  
    expect(element).toBeDefined()
})*/

// testing the button click functionality
test('clicking the button calls event handler once', async () => {
    const note = {
        content: 'Component testing is done with react-testing-library',
        important: true
    }

    const mockHandler = vi.fn()
    render (
        <Note note={note} toggleImportance={mockHandler}/>
    )

    const user = userEvent.setup()
    const button = screen.getByText("make not important")
    await user.click(button)

    expect(mockHandler.mock.calls).toHaveLength(1)
})