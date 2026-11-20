import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "@/components/checkbox/checkbox.tsx";
import { List } from "@/components/list/list.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { laterAction } from "@/components/todo-row/todo-row-actions.tsx";

afterEach(cleanup);

describe("TodoRow", () => {
  it("offers Tomorrow in the tray and runs it", async () => {
    const onLater = vi.fn();
    render(<TodoRow title="Call Ana" actions={[laterAction(onLater)]} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tomorrow" }));
    expect(onLater).toHaveBeenCalledOnce();
  });

  it("draws no tray without actions", () => {
    render(<TodoRow title="Call Ana" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("draws what it is given on the left", async () => {
    const onChange = vi.fn();
    render(
      <TodoRow title="Call Ana" start={<Checkbox label="Call Ana" onCheckedChange={onChange} />} />,
    );
    await userEvent.setup().click(screen.getByRole("checkbox", { name: "Call Ana" }));
    expect(onChange).toHaveBeenCalledWith(true);
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
