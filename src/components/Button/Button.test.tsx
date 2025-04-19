import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Button from "./Button";

describe("Button component", () => {
  it("renders correctly with default props", () => {
    render(<Button>Test Button</Button>);

    const button = screen.getByRole("button", { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-blue-500");
    expect(button).not.toBeDisabled();
  });

  it("applies the correct variant styles", () => {
    render(<Button variant="secondary">Secondary Button</Button>);

    const button = screen.getByRole("button", { name: /secondary button/i });
    expect(button).toHaveClass("bg-gray-200");
  });

  it("applies the correct size styles", () => {
    render(<Button size="lg">Large Button</Button>);

    const button = screen.getByRole("button", { name: /large button/i });
    expect(button).toHaveClass("py-3 px-6 text-lg");
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50 cursor-not-allowed");
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);

    const button = screen.getByRole("button", { name: /clickable button/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
