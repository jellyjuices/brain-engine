import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { List } from "@/components/row/list.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";

afterEach(cleanup);

describe("TodoRow", () => {
  it("offers Tomorrow in the tray and runs it", async () => {
    const onLater = vi.fn();
    render(<TodoRow title="Call Ana" onLater={onLater} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tomorrow" }));
    expect(onLater).toHaveBeenCalledOnce();
  });

  it("sits in a list as one list item", () => {
    render(
      <List>
        <TodoRow title="One" />
        <TodoRow title="Two" />
      </List>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("list").tagName).toBe("UL");
  });
});
