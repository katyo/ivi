import { EventFlags, EventHandlerNode, SyntheticEvent, Events } from "ivi";
import * as events from "ivi";
import * as h from "ivi-html";
import { testRenderDOM } from "ivi-test";

function createMouseEvent(type: string): MouseEvent {
  if (document.createEvent) {
    const ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(type, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null!);
    return ev;
  }
  return new MouseEvent(type);
}

export interface EventCounter {
  value: number;
  event: EventHandlerNode<any>;
}

export function eventCounter(handlerFactory: (
  handler: (ev: SyntheticEvent) => void,
  capture?: boolean) => EventHandlerNode<any>,
): EventCounter {
  const c = {
    value: 0,
    event: null as EventHandlerNode<any> | null,
  };
  c.event = handlerFactory(() => {
    c.value++;
  }, false);

  return c as EventCounter;
}

describe("events", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  test(`<div onclick=FN>`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      const n = r(
        Events(click.event,
          h.div(),
        )
      )!;
      n.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);
    });
  });

  test(`<div onclick=FN onclick=FN>`, () => {
    testRenderDOM(r => {
      const aClick = eventCounter(events.onClick);
      const bClick = eventCounter(events.onClick);
      const n = r(
        Events([aClick.event, bClick.event],
          h.div(),
        ),
      )!;
      n.dispatchEvent(createMouseEvent("click"));

      expect(aClick.value).toBe(1);
      expect(bClick.value).toBe(1);
    });
  });

  test(`<div onclick=FN onmousedown=FN>`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      const mousedown = eventCounter(events.onMouseDown);
      const n = r(
        Events([click.event, mousedown.event],
          h.div(),
        ),
      )!;

      n.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);
      expect(mousedown.value).toBe(0);

      n.dispatchEvent(createMouseEvent("mousedown"));

      expect(click.value).toBe(1);
      expect(mousedown.value).toBe(1);
    });
  });

  test(`[] => []`, () => {
    testRenderDOM(r => {
      expect(() => {
        r(Events([], h.div()));
        r(Events([], h.div()));
      }).not.toThrow();
    });
  });

  test(`null => onclick`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      r(
        Events(null,
          h.div()
        ),
      );
      const b = r(
        Events(click.event,
          h.div()
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);
    });
  });

  test(`onclick => null`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      r(
        Events(click.event,
          h.div(),
        ),
      );
      const b = r(
        Events(null,
          h.div(),
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(0);
    });
  });

  test(`null => [onclick]`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      r(
        Events(null,
          h.div(),
        ),
      );
      const b = r(
        Events([click.event],
          h.div(),
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);
    });
  });

  test(`[onclick] => null`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      r(
        Events([click.event],
          h.div(),
        ),
      );
      const b = r(
        Events(null,
          h.div(),
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(0);
    });
  });

  // TODO: dev mode errors
  //
  // test(`onclick => [onclick]`, () => {
  //   testRenderDOM(r => {
  //     const click1 = eventCounter(events.onClick);
  //     const click2 = eventCounter(events.onClick);
  //     r(h.div().e(
  //       click1.event,
  //     ));
  //     const b = r(h.div().e([
  //       click2.event,
  //     ]));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click1.value).toBe(0);
  //     expect(click2.value).toBe(1);
  //   });
  // });

  // test(`[onclick] => onclick`, () => {
  //   testRenderDOM(r => {
  //     const click1 = eventCounter(events.onClick);
  //     const click2 = eventCounter(events.onClick);
  //     r(h.div().e([
  //       click1.event,
  //     ]));
  //     const b = r(h.div().e(
  //       click2.event,
  //     ));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click1.value).toBe(0);
  //     expect(click2.value).toBe(1);
  //   });
  // });

  // test(`[] => [onclick]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     r(h.div().e([]));
  //     const b = r(h.div().e([
  //       click.event,
  //     ]));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(1);
  //   });
  // });

  // test(`[onclick] => []`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     r(h.div().e([
  //       click.event,
  //     ]));
  //     const b = r(h.div().e([]));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);
  //   });
  // });

  // test(`unassigned => [onclick, onmousedown]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div());
  //     const b = r(h.div().e([click.event, mousedown.event]));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(1);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(1);
  //   });
  // });

  // test(`null => [onclick, onmousedown]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div().e(null));
  //     const b = r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(1);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(1);
  //   });
  // });

  // test(`[] => [onclick, onmousedown]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div().e([]));
  //     const b = r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));

  //     b!.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(1);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(1);
  //   });
  // });

  // test(`null => [onclick, onclick]`, () => {
  //   testRenderDOM(r => {
  //     const aClick = eventCounter(events.onClick);
  //     const bClick = eventCounter(events.onClick);
  //     r(h.div().e(null));
  //     const b = r(h.div().e([
  //       aClick.event,
  //       bClick.event,
  //     ]));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(aClick.value).toBe(1);
  //     expect(bClick.value).toBe(1);
  //   });
  // });

  test(`[onclick] => [onclick]`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      r(
        Events([click.event],
          h.div()
        ),
      );
      const b = r(
        Events([click.event],
          h.div(),
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);
    });
  });

  // test(`[onclick] => unassigned`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     r(h.div().e([
  //       click.event,
  //     ]));
  //     const b = r(h.div());
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);
  //   });
  // });

  // test(`[onclick] => null`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     r(h.div().e([
  //       click.event,
  //     ]));
  //     const b = r(h.div().e(
  //       null,
  //     ));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);
  //   });
  // });

  // test(`[onclick] => []`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     r(h.div().e([
  //       click.event,
  //     ]));
  //     const b = r(h.div().e([]));
  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);
  //   });
  // });

  test(`[onclick, null] => [null, onclick]`, () => {
    testRenderDOM(r => {
      const aClick = eventCounter(events.onClick);
      const bClick = eventCounter(events.onClick);
      r(
        Events([aClick.event, null],
          h.div(),
        ),
      );
      const b = r(
        Events([null, bClick.event],
          h.div(),
        ),
      )!;
      b.dispatchEvent(createMouseEvent("click"));

      expect(aClick.value).toBe(0);
      expect(bClick.value).toBe(1);
    });
  });

  // test(`[onclick, onmousedown] => []`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));
  //     const b = r(h.div().e([]));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(0);
  //   });
  // });

  // test(`[onclick, onmousedown] => null`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));
  //     const b = r(h.div().e(
  //       null,
  //     ));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(0);
  //   });
  // });

  // test(`[onclick, onmousedown] => [onclick]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));
  //     const b = r(h.div().e([
  //       click.event,
  //     ]));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(1);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(0);
  //   });
  // });

  test(`[onclick, onmousedown] => [onclick, onmouseup]`, () => {
    testRenderDOM(r => {
      const click = eventCounter(events.onClick);
      const mousedown = eventCounter(events.onMouseDown);
      const mouseup = eventCounter(events.onMouseUp);
      r(
        Events([click.event, mousedown.event],
          h.div(),
        ),
      );
      const b = r(
        Events([click.event, mouseup.event],
          h.div(),
        ),
      )!;

      b.dispatchEvent(createMouseEvent("click"));

      expect(click.value).toBe(1);

      b.dispatchEvent(createMouseEvent("mousedown"));

      expect(mousedown.value).toBe(0);

      b.dispatchEvent(createMouseEvent("mouseup"));

      expect(mouseup.value).toBe(1);
    });
  });

  // test(`[onclick, onmousedown] => [onmouseup]`, () => {
  //   testRenderDOM(r => {
  //     const click = eventCounter(events.onClick);
  //     const mousedown = eventCounter(events.onMouseDown);
  //     const mouseup = eventCounter(events.onMouseUp);
  //     r(h.div().e([
  //       click.event,
  //       mousedown.event,
  //     ]));
  //     const b = r(h.div().e([
  //       mouseup.event,
  //     ]));

  //     b.dispatchEvent(createMouseEvent("click"));

  //     expect(click.value).toBe(0);

  //     b.dispatchEvent(createMouseEvent("mousedown"));

  //     expect(mousedown.value).toBe(0);

  //     b.dispatchEvent(createMouseEvent("mouseup"));

  //     expect(mouseup.value).toBe(1);
  //   });
  // });

  test(`EventFlags.PreventDefault should trigger native prevent default behavior`, () => {
    testRenderDOM<HTMLInputElement>(r => {
      const n = r(
        Events(events.onClick(() => EventFlags.PreventDefault),
          h.input("", { type: "checkbox" }),
        ),
      )!;

      n.dispatchEvent(createMouseEvent("click"));
      expect(n.checked).toBeFalsy();
    });
  });
});
