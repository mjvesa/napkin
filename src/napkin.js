import "@vaadin/vaadin-button";
import "@vaadin/vaadin-checkbox";
import "@vaadin/vaadin-checkbox/theme/lumo/vaadin-checkbox-group.js";
import "@vaadin/vaadin-radio-button";
import "@vaadin/vaadin-radio-button/theme/lumo/vaadin-radio-group.js";
import "@vaadin/vaadin-item";
import "@vaadin/vaadin-icons";
import "@vaadin/vaadin-combo-box";
import "@vaadin/vaadin-text-field";
import "@vaadin/vaadin-tabs/theme/lumo/vaadin-tabs.js";
import "@vaadin/vaadin-tabs/theme/lumo/vaadin-tab.js";

import "@vaadin/vaadin-lumo-styles/color.js";
import "@vaadin/vaadin-lumo-styles/sizing.js";
import "@vaadin/vaadin-lumo-styles/spacing.js";
import "@vaadin/vaadin-lumo-styles/style.js";
import "@vaadin/vaadin-lumo-styles/typography.js";

import { brute } from "./brute";

let $ = document.querySelector.bind(document);

// Take long runs of white and squeeze them into one.
const thin_mono = arr => {
  let result = [];
  let begin_x = -1;
  for (let i = 0; i < arr.length; i++) {
    result[i] = 0;
    if (arr[i] > 0 && begin_x < 0) {
      begin_x = i;
    } else if (arr[i] === 0 && begin_x >= 0) {
      result[((i + begin_x) / 2) | 0] = 255;
      begin_x = -1;
    }
  }
  return result;
};

const scan_horizontal_edge_no_gaps = (y, x1, x2, image, gapLimit) => {
  let i = y * 640;
  let x = x1; //((x2 - x1) * Math.random()) | 0;
  while (image[i + x] === 0 && x <= x2) {
    x++;
  }

  if (x > x2) {
    return false;
  }

  let startX = x;
  let currentY = 0;
  let gapLength = 0;
  while (x >= x1) {
    if (image[i + x + currentY * 640] > 0) {
      x--;
      gapLength = 0;
      continue;
    }
    if (image[i + x + currentY * 640 - 640] > 0) {
      currentY--;
      x--;
      gapLength = 0;
      continue;
    }
    if (image[i + x + currentY * 640 + 640] > 0) {
      currentY++;
      x--;
      gapLength = 0;
      continue;
    }
    gapLength++;
    if (gapLength === gapLimit) {
      return false;
    }
    x--;
  }
  x = startX;
  currentY = 0;
  while (x <= x2) {
    if (image[i + x + currentY * 640] > 0) {
      x++;
      gapLength = 0;
      continue;
    }
    if (image[i + x + currentY * 640 - 640] > 0) {
      currentY--;
      x++;
      gapLength = 0;
      continue;
    }
    if (image[i + x + currentY * 640 + 640] > 0) {
      currentY++;
      x++;
      gapLength = 0;
      continue;
    }
    gapLength++;
    if (gapLength === gapLimit) {
      return false;
    }
    x++;
  }
  return true;
};

const scan_vertical_edge_no_gaps = (x, y1, y2, image, gapLimit) => {
  let i = x;
  let y = y1; //((y2 - y1) * Math.random()) | 0;
  while (image[i + y * 640] === 0 && y <= y2) {
    y++;
  }

  if (y > y2) {
    return false;
  }

  let startY = y;
  let currentX = 0;
  let gapLength = 0;
  while (y >= y1) {
    if (image[i + y * 640 + currentX] > 0) {
      y--;
      gapLength = 0;
      continue;
    }
    if (image[i + y * 640 + currentX - 1] > 0) {
      currentX--;
      y--;
      gapLength = 0;
      continue;
    }
    if (image[i + y * 640 + currentX + 1] > 0) {
      currentX++;
      y--;
      gapLength = 0;
      continue;
    }
    gapLength++;
    if (gapLength === gapLimit) {
      return false;
    }
    y--;
  }
  y = startY;
  currentX = 0;
  while (y <= y2) {
    if (image[i + y * 640 + currentX] > 0) {
      y++;
      gapLength = 0;
      continue;
    }
    if (image[i + y * 640 + currentX - 1] > 0) {
      currentX--;
      y++;
      gapLength = 0;
      continue;
    }
    if (image[i + y * 640 + currentX + 1] > 0) {
      currentX++;
      y++;
      gapLength = 0;
      continue;
    }
    gapLength++;
    if (gapLength === gapLimit) {
      return false;
    }
    y++;
  }
  return true;
};

const find_vertical_edges = image => {
  let edges = [];
  for (let x = 0; x < 640; x++) {
    let i = x;
    let acc = 0;
    for (let y = 0; y < 640; y++) {
      if (image[i]) {
        acc += image[i];
      }
      i += 640;
    }
    edges[x] = (acc / 255) | 0;
  }
  let diffs = [];
  diffs[0] = 0;
  diffs[639] = 0;
  for (let i = 1; i < 639; i++) {
    let diff = Math.abs(edges[i - 1] - edges[i + 1]);
    if (diff > 16) {
      diff = 255;
    } else {
      diff = 0;
    }
    diffs[i] = diff;
  }
  return diffs;
};

const find_horizontal_edges = image => {
  let edges = [];
  for (let y = 0; y < 640; y++) {
    let i = y * 640;
    let acc = 0;
    for (let x = 0; x < 640; x++) {
      acc += image[i];
      i++;
    }
    edges[y] = (acc / 255) | 0;
  }
  let diffs = [];
  diffs[0] = 0;
  diffs[639] = 0;
  for (let i = 1; i < 639; i++) {
    let diff = Math.abs(edges[i - 1] - edges[i + 1]);
    if (diff > 16) {
      diff = 255;
    } else {
      diff = 0;
    }
    diffs[i] = diff;
  }
  return diffs;
};

const blur = arr => {
  const blurred = [];
  let i = 640;
  for (let y = 1; y < 640 - 1; y++) {
    for (let x = 1; x < 640 - 1; x++) {
      blurred[i] =
        ((arr[i - 1] + arr[i + 1] + arr[i - 640] + arr[i + 640]) / 4) | 0;
      i++;
    }
    i += 2;
  }
  return blurred;
};

// get a picture with defined edges and a map of vertical and horizontal lines
// in the image
const prepare = canvas_pixels => {
  let i, a, x, y, distance, max, min, x2, y2;
  let prepared = [];
  i = 0;

  let ys = [];
  let xs = [];

  // Convert into grayscale
  for (y = 0; y < 640; y++) {
    for (x = 0; x < 640; x++) {
      a =
        255 -
        (canvas_pixels[i * 4] +
          canvas_pixels[i * 4 + 1] +
          canvas_pixels[i * 4 + 1]) /
          3;
      prepared[i] = a;
      i++;
    }
  }

  /*
  prepared = blur(prepared);
  prepared = blur(prepared);
  prepared = blur(prepared);
  prepared = blur(prepared);
*/
  max = 0;
  min = 255;
  let sharpened = [];
  i = 640;
  for (y = 1; y < 640 - 1; y++) {
    for (x = 1; x < 640 - 1; x++) {
      let diff =
        Math.abs(prepared[i] - prepared[i + 1]) +
        Math.abs(prepared[i] - prepared[i + 640]);
      /*
        Math.abs(prepared[i] - prepared[i - 1]) +
        Math.abs(prepared[i] - prepared[i - 1 - 640]) +
        Math.abs(prepared[i] - prepared[i - 640]) +
        Math.abs(prepared[i] - prepared[i - 640 + 1]) +
        Math.abs(prepared[i] - prepared[i + 1]) +
        Math.abs(prepared[i] - prepared[i + 640 + 1]) +
        Math.abs(prepared[i] - prepared[i + 640]) +
        Math.abs(prepared[i] - prepared[i + 640 - 1]);
        */
      if (diff > 255) {
        diff = 255;
      }
      if (diff > max) {
        max = diff;
      }
      if (diff < min) {
        min = diff;
      }

      sharpened[i] = diff;
      i++;
    }
    i += 2;
  }

  sharpened = blur(sharpened);
  sharpened = blur(sharpened);
  ///sharpened = blur(sharpened);
  //sharpened = blur(sharpened);

  i = 0;
  for (y = 0; y < 640; y++) {
    for (x = 0; x < 640; x++) {
      a = (((sharpened[i] - min) * 255) / (max - min + 1)) | 0;
      if (a > 10) {
        a = 255;
      } else {
        a = 0;
      }
      sharpened[i] = a;
      i++;
    }
  }
  prepared = sharpened;

  const erode = image => {
    const thinned = new Array(640 * 640).fill(0);
    i = 640;
    for (y = 1; y < 640 - 1; y++) {
      for (x = 1; x < 640 - 1; x++) {
        let neighbors =
          /*
          ((prepared[i] +
            prepared[i - 1] +
            prepared[i - 640] +
            prepared[i + 1] +
            prepared[i + 640]) /
            255) |
          0;*/

          ((image[i] +
            image[i - 1] +
            image[i - 1 - 640] +
            image[i - 640] +
            image[i - 640 + 1] +
            image[i + 1] +
            image[i + 640 + 1] +
            image[i + 640] +
            image[i + 640 - 1]) /
            255) |
          0;

        if (neighbors < 9 || neighbors === 0) {
          thinned[i] = 0;
        } else {
          thinned[i] = 255;
        }
        i++;
      }
      i += 2;
    }

    return thinned;
  };

  // prepared = erode(prepared);

  xs = find_vertical_edges(prepared);
  ys = find_horizontal_edges(prepared);
  xs = thin_mono(xs);
  ys = thin_mono(ys);
  /*
  i = 0;
  for (y = 0; y < 640; y++) {
    for (x = 0; x < 640; x++) {
      a = 0;
      // if (xs[x] > 64 || ys[y] > 64) {
      a = ys[y] + xs[x];
      // }
      prepared[i] += a;
      i++;
    }
    
  }*/
  return [xs, ys, prepared];
};

let rects = [];

const draw_rects = rects => {
  createTreeFromRects(rects);
  const rectCanvas = document.querySelector("#cam-canvas");
  const ctx = rectCanvas.getContext("2d");
  rectCanvas.innerHTML = "";
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.lineWidth = "4";
  ctx.font = "20px arial";
  let order = 1;
  rects.forEach(rect => {
    ctx.rect(
      rect.left | 0,
      rect.top | 0,
      (rect.right - rect.left) | 0,
      (rect.bottom - rect.top) | 0
    );

    const tag = getTagForRect(rect);
    ctx.fillText(
      tag /*+ ` w:${rect.right - rect.left} h:${rect.bottom - rect.top}`*/,
      rect.left,
      rect.top - 10
    );

    order++;
  });
  ctx.stroke();
};

const collect_rects = (xs, ys, image) => {
  const rects = [];
  // Go trough each potential rect (x,y, x2, y2)
  for (let y = 0; y < ys.length; y++) {
    if (ys[y] > 0) {
      for (let x = 0; x < xs.length; x++) {
        if (xs[x] > 0) {
          for (let y2 = ys.length - 1; y2 > y; y2--) {
            if (ys[y2] > 0) {
              for (let x2 = xs.length - 1; x2 > x; x2--) {
                if (xs[x2] > 0) {
                  // If we indeed have a rectangle under there and it is large enough, add it
                  if (
                    scan_horizontal_edge_no_gaps(y, x, x2, image, 8) &&
                    scan_horizontal_edge_no_gaps(y2, x, x2, image, 8) &&
                    scan_vertical_edge_no_gaps(x, y, y2, image, 8) &&
                    scan_vertical_edge_no_gaps(x2, y, y2, image, 8) &&
                    x2 - x > 32 &&
                    y2 - y > 32
                  ) {
                    rects.push({ left: x, top: y, right: x2, bottom: y2 });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return rects;
};

const point_on_horizontal_edge = (x, y, x1, y1, x2, y2) => {
  if (Math.abs(y - y1) < 4 && x >= x1 - 4 && x <= x2 + 4) {
    return true;
  }
  return false;
};

const point_on_vertical_edge = (x, y, x1, y1, x2, y2) => {
  if (Math.abs(x - x1) < 4 && y >= y1 - 4 && y <= y2 + 4) {
    return true;
  }
  return false;
};

const point_on_rect = (x, y, rect) => {
  if (
    point_on_horizontal_edge(x, y, rect.left, rect.top, rect.right, rect.top) ||
    point_on_horizontal_edge(
      x,
      y,
      rect.left,
      rect.bottom,
      rect.right,
      rect.bottom
    ) ||
    point_on_vertical_edge(x, y, rect.left, rect.top, rect.left, rect.bottom) ||
    point_on_vertical_edge(x, y, rect.right, rect.top, rect.right, rect.bottom)
  ) {
    return true;
  }
  return false;
};

const filter_rects = (rects, oldRects) => {
  const filtered = oldRects.slice();
  for (const rect of rects) {
    const midX = (rect.left + rect.right) / 2;
    const midY = (rect.top + rect.bottom) / 2;
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    let newOne = true;
    for (const filteredRect of filtered) {
      const filteredMidX = (filteredRect.left + filteredRect.right) / 2;
      const filteredMidY = (filteredRect.top + filteredRect.bottom) / 2;
      const filteredWidth = filteredRect.right - filteredRect.left;
      const filteredHeight = filteredRect.bottom - filteredRect.top;
      if (
        (filteredMidX - midX) * (filteredMidX - midX) +
          (filteredMidY - midY) * (filteredMidY - midY) <
          1000 &&
        Math.abs(filteredWidth - width) < 50 &&
        Math.abs(filteredHeight - height) < 50
      ) {
        newOne = false;
        break;
      }

      // TODO check that no edges are shared, even partially.

      if (
        point_on_rect(rect.left, rect.top, filteredRect) ||
        point_on_rect(rect.right, rect.top, filteredRect) ||
        point_on_rect(rect.left, rect.bottom, filteredRect) ||
        point_on_rect(rect.right, rect.bottom, filteredRect)
      ) {
        newOne = false;
        break;
      }
    }
    if (newOne) {
      filtered.push(rect);
    }
  }
  return filtered;
};

const draw_image = (image, canvas) => {
  let x, y, i, j;

  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, 640, 640);

  i = 0;
  j = 0;
  for (y = 0; y < 640; y++) {
    for (x = 0; x < 640; x++) {
      let c = image[i];
      imageData.data[j] = c;
      imageData.data[j + 1] = c;
      imageData.data[j + 2] = c;
      imageData.data[j + 3] = 255;
      i++;
      j += 4;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

////////////////////////////////////////////////////////////////////////////////

let image;

const ipsumLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum".split(
  " "
);

const getWord = () => {
  return ipsumLorem[(Math.random() * ipsumLorem.length) | 0];
};
const childOf = (rectA, rectB) => {
  return (
    rectA.left > rectB.left &&
    rectA.top > rectB.top &&
    rectA.right < rectB.right &&
    rectA.bottom < rectB.bottom
  );
};

const isSquarish = rect => {
  const ratio = (rect.right - rect.left) / (rect.bottom - rect.top);
  return ratio > 0.7 && ratio < 1.3;
};

const isCheckBox = rect => {
  return (
    isSquarish(rect) &&
    rectCoverage(rect.left, rect.top, rect.right, rect.bottom, image) > 0.7
  );
};

const isRadioButton = rect => {
  const left = rect.left + (rect.right - rect.left) * 0.3;
  const top = rect.top + (rect.bottom - rect.top) * 0.3;
  const right = rect.left + (rect.right - rect.left) * 0.6;
  const bottom = rect.top + (rect.bottom - rect.top) * 0.6;

  return (
    isSquarish(rect) &&
    rectCoverage(left | 0, top | 0, right | 0, bottom | 0, image) > 0.3
  );
};

const isRadioGroup = rect => {
  if (!rect.children) {
    return false;
  }
  let result = true;
  rect.children.forEach(rect => {
    if (!isRadioButton(rect)) {
      result = false;
    }
  });
  return result;
};

const isCheckBoxGroup = rect => {
  if (!rect.children) {
    return false;
  }
  let result = true;
  rect.children.forEach(rect => {
    if (!isCheckBox(rect)) {
      result = false;
    }
  });
  return result;
};

const isTabs = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  const middleY = (rect.bottom + rect.top) / 2;
  const oneThirdsX = rect.left + (rect.right - rect.left) * 0.3;
  return (
    w / h > 2 &&
    line_coverage(rect.left, middleY, oneThirdsX, middleY, image) > 0.5
  );
};

const isComboBox = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  const middleY = (rect.bottom + rect.top) / 2;
  const oneThirdsX = rect.left + (rect.right - rect.left) * 0.3;
  const twoThirdsX = rect.left + (rect.right - rect.left) * 0.6;
  return (
    w / h > 2 &&
    line_coverage(oneThirdsX, middleY, twoThirdsX, middleY, image) > 0.7
  );
};

const isSpan = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  const middleY = (rect.bottom + rect.top) / 2;
  return (
    w / h > 1.5 &&
    line_coverage(rect.left, middleY, rect.right, middleY, image) > 0.7
  );
};

const rectCoverage = (left, top, right, bottom, image) => {
  const area = (right - left) * (bottom - top);
  let acc = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      acc += image[x + y * 640] > 0 ? 1 : 0;
    }
  }
  return acc / area;
};

const isButton = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  return (
    w / h > 2 &&
    rectCoverage(rect.left, rect.top, rect.right, rect.bottom, image) > 0.7
  );
};

const isVerticalLayout = rect => {
  if (!rect.children || rect.children.length < 2) {
    return false;
  }
  let result = true;
  rect.children.forEach(outer => {
    rect.children.forEach(inner => {
      const hdiff = Math.abs(outer.left - inner.left);
      const vdiff = Math.abs(outer.top - inner.top);
      if (hdiff > vdiff) {
        result = false;
      }
    });
  });

  return result;
};

const isHorizontalLayout = rect => {
  if (!rect.children || rect.children.length < 2) {
    return false;
  }
  let result = true;
  rect.children.forEach(outer => {
    rect.children.forEach(inner => {
      const hdiff = Math.abs(outer.left - inner.left);
      const vdiff = Math.abs(outer.top - inner.top);
      if (hdiff < vdiff) {
        result = false;
      }
    });
  });

  return result;
};

const rectArea = rect => {
  const w = Math.abs(rect.right - rect.left);
  const h = Math.abs(rect.bottom - rect.top);
  return w * h;
};

const pointInsideRect = (rect, x, y) => {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
};

const getSmallestRect = rects => {
  let smallestArea = rectArea(rects[0]);
  let smallest = rects[0];
  rects.forEach(rect => {
    if (rectArea(rect) < smallestArea) {
      smallestArea = rectArea(rect);
      smallest = rect;
    }
  });
  return smallest;
};

const line_coverage = (x1, y1, x2, y2, image) => {
  let acc = 0;
  for (let i = 0; i < 1; i += 0.01) {
    let x = (x2 * i + x1 * (1 - i)) | 0;
    let y = (y2 * i + y1 * (1 - i)) | 0;
    let j = x + y * 640;
    if (
      image[j] > 0 ||
      image[j + 1] > 0 ||
      image[j - 1] > 0 ||
      image[j + 640] > 0 ||
      image[j - 640] > 0
    ) {
      acc++;
    }
  }
  return acc / 100;
};

const isImage = rect => {
  return (
    line_coverage(rect.left, rect.top, rect.right, rect.bottom, image) > 0.4 &&
    line_coverage(rect.left, rect.bottom, rect.right, rect.top, image) > 0.4
  );
};

const heuristics = [
  [isVerticalLayout, "div"],
  [isHorizontalLayout, "div"],
  [isButton, "vaadin-button"],
  [isSpan, "span"],
  [isTabs, "vaadin-tabs"],
  [isComboBox, "vaadin-combo-box"],
  [isCheckBox, "vaadin-checkbox"],
  [isRadioButton, "vaadin-radio-button"],
  [isImage, "img"]
];

const getTagForRect = rect => {
  for (let i = 0; i < heuristics.length; i++) {
    const heuristic = heuristics[i];
    if (heuristic[0](rect)) {
      return heuristic[1];
    }
  }
  return "vaadin-text-field";
};

const createTreeFromRects = rects => {
  const roots = [];
  rects.forEach(rect => {
    let smallestArea = 10000000;
    let potentialParent;
    rects.forEach(parentRect => {
      const area =
        Math.abs(parentRect.right - parentRect.left) *
        Math.abs(parentRect.bottom - parentRect.top);
      if (area < smallestArea && childOf(rect, parentRect)) {
        potentialParent = parentRect;
        smallestArea = area;
      }
    });
    if (potentialParent) {
      const children = potentialParent.children || [];
      children.push(rect);
      potentialParent.children = children;
    } else {
      roots.push(rect);
    }
  });
  return roots;
};

const deleteRectChildren = rects => {
  rects.forEach(rect => {
    delete rect.children;
  });
};

const hideCurrentGuess = () => {
  $("#current-guess").style.display = "none";
};

const rectRatio = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  return w / h;
};

export const createAndAppendChildElements = rects => {
  let tree = [];
  const setAttribute = (name, value) => {
    tree.push(name, value, "=");
  };
  rects.forEach(rect => {
    const children = [];
    let styles = "";
    let tagName = getTagForRect(rect);
    tree.push(tagName);
    tree.push("(");
    if (rect.css_props) {
      styles = rect.css_props;
    }

    styles = styles + "margin: 1rem;";

    if (rect.children) {
      if (isVerticalLayout(rect)) {
        rect.children.sort((rectA, rectB) => {
          return rectA.top - rectB.top;
        });
      } else {
        rect.children.sort((rectA, rectB) => {
          return rectA.left - rectB.left;
        });
      }
    }

    // Use brute to determine flexbox properties for div
    if (tagName === "div" && rect.children) {
      styles = styles + brute(rect.children, rect);
    }

    // Temporary hardcodings
    if (tagName === "vaadin-button") {
      rect.text = getWord();
      setAttribute("theme", "primary");
    }

    if (tagName === "span") {
      rect.text = getWord();
    }

    if (tagName === "img") {
      setAttribute(
        "src",
        "data:image/jpeg;base64,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"
      );
    }

    if (tagName === "vaadin-text-field") {
      setAttribute("label", getWord());
    }
    if (tagName === "vaadin-tabs") {
      rect.text = "Tab 1|Tab 2|Tab 3";
    }

    if (tagName === "vaadin-combo-box") {
      setAttribute(
        "items",
        '["item 1", "item 2", "item 3", "item 4", "item 5"]'
      );
    }

    if (rect.text) {
      if (rect.text.includes("|")) {
        rect.text.split("|").forEach(str => {
          children.push("vaadin-tab", "(", "textContent", str, "=", ")");
        });
      } else {
        setAttribute("textContent", rect.text);
      }
    }

    if (styles.length > 0) {
      setAttribute("style", styles);
    }
    if (children.length > 0) {
      tree = tree.concat(children);
    }

    if (rect.children) {
      tree = tree.concat(createAndAppendChildElements(rect.children));
    }
    tree.push(")");
  });
  return tree;
};

export const modelToDOM = (code, target) => {
  const stack = [];
  const tree = [];
  let current = target;
  code.forEach((str, index) => {
    const trimmed = str.trim();
    switch (trimmed) {
      case "(": {
        const old = current;
        tree.push(current);
        const tag = stack.pop();
        current = document.createElement(tag);
        old.appendChild(current);
        break;
      }
      case ")": {
        current = tree.pop();
        break;
      }
      case "=": {
        const tos = stack.pop();
        const nos = stack.pop();
        if (nos in current) {
          try {
            const json = JSON.parse(tos);
            current[nos] = json;
          } catch (e) {
            current[nos] = tos;
            current.setAttribute(nos, tos);
          }
        } else {
          current.setAttribute(nos, tos);
        }

        break;
      }
      default: {
        stack.push(trimmed);
      }
    }
  });
  return current;
};

let designAtir = [];
let rectangleSynthesisRunning = true;

const enterSketchMode = (targetEl, designCallback) => {
  rects = [];

  const video = document.querySelector("video");
  const canvas = document.getElementById("cam-canvas");
  const update_view = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    if (!rectangleSynthesisRunning) {
      const imageData = ctx.getImageData(0, 0, 640, 640);
      let [xs, ys, prepared] = prepare(imageData.data);
      //draw_image(prepared, document.getElementById("result-image"));
      const newRects = collect_rects(xs, ys, prepared);
      rects = filter_rects(newRects, rects);
      image = prepared;
      draw_rects(rects);
      deleteRectChildren(rects);
    } else {
      window.requestAnimationFrame(update_view);
    }
  };

  window.requestAnimationFrame(update_view);

  let currentStream;

  const chooseDevice = id => {
    if (currentStream) {
      currentStream.getVideoTracks().forEach(track => {
        track.stop();
      });
    }
    const constraints = {
      video: {
        width: { exact: 640 },
        height: { exact: 480 },
        deviceId: id
      }
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        currentStream = stream;
        video.srcObject = stream;
      })
      .catch(error => console.log(error));
  };

  const deviceList = document.getElementById("device-list");

  navigator.mediaDevices.enumerateDevices().then(devices => {
    let firstDevice = null;
    devices.forEach(device => {
      if (device.kind === "videoinput") {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "device";
        input.value = device.deviceId;
        input.onclick = event => {
          const id = event.target.value;
          console.log("choosing " + id);
          chooseDevice(id);
        };
        deviceList.appendChild(input);

        const label = document.createElement("label");
        label.for = device.id;
        label.textContent = device.label;
        deviceList.appendChild(label);
        if (!firstDevice) {
          firstDevice = input;
        }
      }
    });
    firstDevice.checked = true;
    chooseDevice(firstDevice.value);
  });

  $("#cam-canvas").onclick = () => {
    if (rectangleSynthesisRunning) {
      rectangleSynthesisRunning = false;
    } else {
      rectangleSynthesisRunning = true;
      rects = [];
      window.requestAnimationFrame(update_view);
    }
  };

  $("#reset").onclick = () => {
    rectangleSynthesisRunning = false;
    $("#content").innerHTML = "";

    deleteRectChildren(rects);
    let roots = createTreeFromRects(rects);
    designAtir = createAndAppendChildElements(roots, image);
    modelToDOM(designAtir, $("#content"));
  };

  $("#share-button").onclick = () => {
    const project = {
      designs: { napkin: { tree: designAtir, css: "" } },
      settings: { packageName: "vaadin.napkin", exportFormat: "Java" }
    };

    if (navigator.share) {
      var f = new File([JSON.stringify(project)], "napkin_design.json.txt", {
        type: "text/plain"
      });
      const shareData = { title: "Napkin design", files: [f] };
      navigator.share(shareData);
    }
  };
};

enterSketchMode(document.getElementById("content"), design => {});
