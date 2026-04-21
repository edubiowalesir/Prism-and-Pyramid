(function () {
  const svg = document.getElementById("shapeStage");
  const slider = document.getElementById("foldSlider");
  const title = document.getElementById("shapeTitle");
  const typeLabel = document.getElementById("shapeTypeLabel");
  const facesCount = document.getElementById("facesCount");
  const edgesCount = document.getElementById("edgesCount");
  const verticesCount = document.getElementById("verticesCount");
  const netType = document.getElementById("netType");
  const promptList = document.getElementById("promptList");
  const prismButtons = document.getElementById("prismButtons");
  const pyramidButtons = document.getElementById("pyramidButtons");
  const resetViewButton = document.getElementById("resetViewButton");

  const SVG_NS = "http://www.w3.org/2000/svg";

  const state = {
    currentId: "triangular-prism",
    fold: 1,
    rotationX: -0.65,
    rotationY: 0.82,
    drag: null,
  };

  const familyTint = {
    "Prism Family": "rgba(113, 147, 216, 0.08)",
    "Pyramid Family": "rgba(223, 100, 165, 0.08)",
  };

  const shapes = [
    createPrismShape({
      id: "triangular-prism",
      name: "Triangular Prism",
      family: "Prism Family",
      sides: 3,
      mainColor: "#5d83d7",
      deepColor: "#355cae",
      prompts: [
        "How many triangular faces and rectangular faces can you see?",
        "What changes when the net opens but the number of faces stays the same?",
        "Can you point to one edge where two faces meet?",
      ],
    }),
    createPrismShape({
      id: "square-prism",
      name: "Square Prism",
      family: "Prism Family",
      sides: 4,
      mainColor: "#4f74c9",
      deepColor: "#2f549f",
      prompts: [
        "How is this prism different from a cube?",
        "Count the rectangles on the sides. How many are there?",
        "Which two faces are the square bases?",
      ],
    }),
    createPrismShape({
      id: "hexagonal-prism",
      name: "Hexagonal Prism",
      family: "Prism Family",
      sides: 6,
      mainColor: "#6789dd",
      deepColor: "#3859aa",
      prompts: [
        "Why does this prism need more side faces than the square prism?",
        "Count the six edges around one hexagonal base.",
        "What happens to the side rectangles when the net folds closed?",
      ],
    }),
    createPyramidShape({
      id: "triangular-pyramid",
      name: "Triangular Pyramid",
      family: "Pyramid Family",
      sides: 3,
      mainColor: "#e15aa3",
      deepColor: "#af2f73",
      prompts: [
        "Why are all the side faces triangles in a pyramid?",
        "Can you find the top point called the apex?",
        "How many faces meet at the apex?",
      ],
    }),
    createPyramidShape({
      id: "square-pyramid",
      name: "Square Pyramid",
      family: "Pyramid Family",
      sides: 4,
      mainColor: "#d95597",
      deepColor: "#9e2d67",
      prompts: [
        "Which face is the square base?",
        "How many triangular faces fold up around the base?",
        "What shape do you get if you open it flat into a net?",
      ],
    }),
    createPyramidShape({
      id: "pentagonal-pyramid",
      name: "Pentagonal Pyramid",
      family: "Pyramid Family",
      sides: 5,
      mainColor: "#ec68ab",
      deepColor: "#b93b7d",
      prompts: [
        "How many edges run from the base up to the apex?",
        "What is the name of the five-sided base?",
        "How does the pentagonal pyramid compare with the square pyramid?",
      ],
    }),
  ];

  const shapeMap = Object.fromEntries(shapes.map((shape) => [shape.id, shape]));

  buildPicker(prismButtons, shapes.filter((shape) => shape.kind === "prism"));
  buildPicker(
    pyramidButtons,
    shapes.filter((shape) => shape.kind === "pyramid")
  );

  slider.addEventListener("input", () => {
    state.fold = Number(slider.value) / 100;
    render();
  });

  document.querySelectorAll("[data-fold]").forEach((button) => {
    button.addEventListener("click", () => {
      slider.value = button.dataset.fold;
      state.fold = Number(button.dataset.fold) / 100;
      render();
    });
  });

  resetViewButton.addEventListener("click", () => {
    state.rotationX = -0.65;
    state.rotationY = 0.82;
    render();
  });

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("pointerleave", onPointerUp);
  svg.addEventListener("pointercancel", onPointerUp);

  render();

  function buildPicker(container, items) {
    items.forEach((shape) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = shape.name;
      button.dataset.shapeId = shape.id;
      button.addEventListener("click", () => {
        state.currentId = shape.id;
        updatePickerState();
        render();
      });
      container.appendChild(button);
    });
    updatePickerState();
  }

  function updatePickerState() {
    document.querySelectorAll("[data-shape-id]").forEach((button) => {
      button.classList.toggle("active", button.dataset.shapeId === state.currentId);
    });
  }

  function onPointerDown(event) {
    state.drag = {
      x: event.clientX,
      y: event.clientY,
      rotationX: state.rotationX,
      rotationY: state.rotationY,
    };
    svg.classList.add("dragging");
    svg.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!state.drag) {
      return;
    }
    const dx = event.clientX - state.drag.x;
    const dy = event.clientY - state.drag.y;
    state.rotationY = state.drag.rotationY + dx * 0.01;
    state.rotationX = clamp(state.drag.rotationX + dy * 0.01, -1.5, 1.5);
    render();
  }

  function onPointerUp(event) {
    if (state.drag) {
      state.drag = null;
      svg.classList.remove("dragging");
      if (event.pointerId !== undefined && svg.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }
    }
  }

  function render() {
    const shape = shapeMap[state.currentId];
    document.querySelector(".stage-wrap").style.background =
      `radial-gradient(circle at 40% 24%, rgba(255,255,255,0.98), rgba(247,244,239,0.95) 58%, rgba(239,235,228,0.92)), linear-gradient(180deg, ${familyTint[shape.family]}, rgba(255,255,255,0))`;
    const scene = shape.getScene(state.fold);
    const centeredScene = centerScene(scene);
    const rotatedFaces = centeredScene.faces.map((face) => ({
      ...face,
      points: face.points.map((point) =>
        rotatePoint(point, state.rotationX, state.rotationY)
      ),
    }));
    const rotatedHinges = centeredScene.hinges.map((hinge) =>
      hinge.map((point) => rotatePoint(point, state.rotationX, state.rotationY))
    );

    drawSvg(rotatedFaces, rotatedHinges, shape.mainColor);
    updateInfo(shape);
  }

  function drawSvg(faces, hinges, accentColor) {
    svg.innerHTML = "";

    const allPoints = faces.flatMap((face) => face.points);
    const projected = allPoints.map((point) => projectRaw(point));
    const bounds = get2DBounds(projected);
    const padding = 70;
    const scale = Math.min(
      (1000 - padding * 2) / Math.max(bounds.width, 1),
      (700 - padding * 2) / Math.max(bounds.height, 1)
    );

    const projectedFaces = faces
      .map((face) => ({
        ...face,
        projected: face.points.map((point) =>
          projectToViewport(projectRaw(point), scale, bounds)
        ),
        depth: average(face.points.map((point) => point.z)),
        centroid3D: centroid3D(face.points),
        normal: faceNormal(face.points),
      }))
      .sort((a, b) => a.depth - b.depth);

    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "softShadow");
    const dropShadow = document.createElementNS(SVG_NS, "feDropShadow");
    dropShadow.setAttribute("dx", "0");
    dropShadow.setAttribute("dy", "10");
    dropShadow.setAttribute("stdDeviation", "8");
    dropShadow.setAttribute("flood-color", "#1d273b");
    dropShadow.setAttribute("flood-opacity", "0.2");
    filter.appendChild(dropShadow);
    const labelShadow = document.createElementNS(SVG_NS, "filter");
    labelShadow.setAttribute("id", "labelShadow");
    const labelDrop = document.createElementNS(SVG_NS, "feDropShadow");
    labelDrop.setAttribute("dx", "0");
    labelDrop.setAttribute("dy", "4");
    labelDrop.setAttribute("stdDeviation", "4");
    labelDrop.setAttribute("flood-color", "#1d273b");
    labelDrop.setAttribute("flood-opacity", "0.16");
    labelShadow.appendChild(labelDrop);
    defs.appendChild(filter);
    defs.appendChild(labelShadow);
    svg.appendChild(defs);

    const shadowEllipse = document.createElementNS(SVG_NS, "ellipse");
    shadowEllipse.setAttribute("cx", "500");
    shadowEllipse.setAttribute("cy", "622");
    shadowEllipse.setAttribute("rx", "250");
    shadowEllipse.setAttribute("ry", "34");
    shadowEllipse.setAttribute("fill", "rgba(23, 35, 53, 0.10)");
    svg.appendChild(shadowEllipse);

    projectedFaces.forEach((face) => {
      const polygon = document.createElementNS(SVG_NS, "polygon");
      const lighting = faceLighting(face.normal);
      polygon.setAttribute(
        "points",
        face.projected.map((point) => `${point.x},${point.y}`).join(" ")
      );
      polygon.setAttribute("fill", shadeColor(face.fill, lighting));
      polygon.setAttribute("stroke", shadeColor(face.stroke, -0.08));
      polygon.setAttribute("stroke-width", "2.8");
      polygon.setAttribute("stroke-linejoin", "round");
      polygon.setAttribute("filter", "url(#softShadow)");
      svg.appendChild(polygon);

      const highlight = document.createElementNS(SVG_NS, "polyline");
      highlight.setAttribute(
        "points",
        face.projected.map((point) => `${point.x},${point.y}`).join(" ")
      );
      highlight.setAttribute("fill", "none");
      highlight.setAttribute("stroke", "rgba(255,255,255,0.45)");
      highlight.setAttribute("stroke-width", "1.2");
      highlight.setAttribute("stroke-linejoin", "round");
      highlight.setAttribute("opacity", clamp(0.22 + lighting * 1.8, 0.14, 0.48));
      svg.appendChild(highlight);
    });

    hinges.forEach((hinge) => {
      const start = projectToViewport(projectRaw(hinge[0]), scale, bounds);
      const end = projectToViewport(projectRaw(hinge[1]), scale, bounds);
      const underlay = document.createElementNS(SVG_NS, "line");
      underlay.setAttribute("x1", start.x);
      underlay.setAttribute("y1", start.y);
      underlay.setAttribute("x2", end.x);
      underlay.setAttribute("y2", end.y);
      underlay.setAttribute("stroke", "rgba(255,255,255,0.92)");
      underlay.setAttribute("stroke-width", "5");
      underlay.setAttribute("stroke-dasharray", "2 12");
      underlay.setAttribute("stroke-linecap", "round");
      underlay.setAttribute("opacity", state.fold < 0.97 ? "0.92" : "0.28");
      svg.appendChild(underlay);

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", start.x);
      line.setAttribute("y1", start.y);
      line.setAttribute("x2", end.x);
      line.setAttribute("y2", end.y);
      line.setAttribute("stroke", shadeColor(accentColor, -0.18));
      line.setAttribute("stroke-width", "2.4");
      line.setAttribute("stroke-dasharray", "7 10");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("opacity", state.fold < 0.97 ? "0.95" : "0.32");
      svg.appendChild(line);
    });

    const labels = buildTeachingLabels(projectedFaces);
    drawTeachingLabels(labels);
  }

  function updateInfo(shape) {
    title.textContent = shape.name;
    typeLabel.textContent = shape.family;
    facesCount.textContent = shape.stats.faces;
    edgesCount.textContent = shape.stats.edges;
    verticesCount.textContent = shape.stats.vertices;
    netType.textContent = shape.netLabel;
    promptList.innerHTML = "";
    shape.prompts.forEach((prompt) => {
      const item = document.createElement("li");
      item.textContent = prompt;
      promptList.appendChild(item);
    });
  }

  function createPrismShape(config) {
    const sideLength = 120;
    const height = 150;
    const basePolygon = regularPolygonFromEdge(config.sides, sideLength, -1);
    const bottomPolygon = regularPolygonFromEdge(config.sides, sideLength, 1);
    const angle = (Math.PI * 2) / config.sides;

    return {
      id: config.id,
      kind: "prism",
      name: config.name,
      family: config.family,
      mainColor: config.mainColor,
      deepColor: config.deepColor,
      prompts: config.prompts,
      netLabel: `${config.sides} rectangles + 2 ${polygonName(config.sides)} bases`,
      stats: {
        faces: config.sides + 2,
        edges: config.sides * 3,
        vertices: config.sides * 2,
      },
      getScene(fold) {
        const faces = [];
        const hinges = [];

        for (let i = 0; i < config.sides; i += 1) {
          let matrix = identity();
          for (let step = 0; step < i; step += 1) {
            matrix = multiply(matrix, translate(sideLength, 0, 0));
            matrix = multiply(matrix, rotateY(-fold * angle));
          }

          const rect = [
            point3(0, 0, 0),
            point3(sideLength, 0, 0),
            point3(sideLength, height, 0),
            point3(0, height, 0),
          ];

          const tint = i % 2 === 0 ? 0.18 : 0.04;
          faces.push({
            points: rect.map((point) => applyMatrix(matrix, point)),
            fill: shadeColor(config.mainColor, tint),
            stroke: config.deepColor,
          });

          if (i > 0) {
            const hingeStart = applyMatrix(matrix, point3(0, 0, 0));
            const hingeEnd = applyMatrix(matrix, point3(0, height, 0));
            hinges.push([hingeStart, hingeEnd]);
          }
        }

        const topMatrix = multiply(identity(), rotateX(-fold * Math.PI * 0.5));
        const bottomMatrix = multiply(
          translate(0, height, 0),
          rotateX(fold * Math.PI * 0.5)
        );

        faces.push({
          points: basePolygon.map((point) => applyMatrix(topMatrix, point)),
          fill: shadeColor(config.mainColor, 0.28),
          stroke: config.deepColor,
        });

        faces.push({
          points: bottomPolygon.map((point) => applyMatrix(bottomMatrix, point)),
          fill: shadeColor(config.mainColor, -0.05),
          stroke: config.deepColor,
        });

        hinges.push([
          applyMatrix(identity(), point3(0, 0, 0)),
          applyMatrix(identity(), point3(sideLength, 0, 0)),
        ]);
        hinges.push([
          applyMatrix(identity(), point3(0, height, 0)),
          applyMatrix(identity(), point3(sideLength, height, 0)),
        ]);

        return { faces, hinges };
      },
    };
  }

  function createPyramidShape(config) {
    const sideLength = 150;
    const basePoints2D = regularPolygonCentered(config.sides, sideLength);
    const apothem = sideLength / (2 * Math.tan(Math.PI / config.sides));
    const pyramidHeight = sideLength * 0.95;
    const slantHeight = Math.sqrt(apothem * apothem + pyramidHeight * pyramidHeight);
    const foldAngle = Math.atan2(pyramidHeight, apothem);

    return {
      id: config.id,
      kind: "pyramid",
      name: config.name,
      family: config.family,
      mainColor: config.mainColor,
      deepColor: config.deepColor,
      prompts: config.prompts,
      netLabel: `1 ${polygonName(config.sides)} base + ${config.sides} triangles`,
      stats: {
        faces: config.sides + 1,
        edges: config.sides * 2,
        vertices: config.sides + 1,
      },
      getScene(fold) {
        const baseFace = {
          points: basePoints2D.map((point) => point3(point.x, point.y, 0)),
          fill: shadeColor(config.mainColor, 0.24),
          stroke: config.deepColor,
        };

        const faces = [baseFace];
        const hinges = [];

        for (let i = 0; i < config.sides; i += 1) {
          const start = basePoints2D[i];
          const end = basePoints2D[(i + 1) % config.sides];
          const edgeVector = normalize2({
            x: end.x - start.x,
            y: end.y - start.y,
          });
          const outward = {
            x: edgeVector.y,
            y: -edgeVector.x,
          };

          const basis = basisFromAxes(
            point3(edgeVector.x, edgeVector.y, 0),
            point3(outward.x, outward.y, 0),
            point3(0, 0, 1)
          );

          const faceMatrix = multiply(
            translate(start.x, start.y, 0),
            multiply(basis, rotateX(-fold * foldAngle))
          );

          const triangle = [
            point3(0, 0, 0),
            point3(sideLength, 0, 0),
            point3(sideLength * 0.5, -slantHeight, 0),
          ];

          faces.push({
            points: triangle.map((point) => applyMatrix(faceMatrix, point)),
            fill: shadeColor(config.mainColor, i % 2 === 0 ? 0.08 : -0.04),
            stroke: config.deepColor,
          });

          hinges.push([
            point3(start.x, start.y, 0),
            point3(end.x, end.y, 0),
          ]);
        }

        return { faces, hinges };
      },
    };
  }

  function regularPolygonFromEdge(sides, edgeLength, direction) {
    const radius = edgeLength / (2 * Math.sin(Math.PI / sides));
    const apothem = edgeLength / (2 * Math.tan(Math.PI / sides));
    const center = { x: edgeLength / 2, y: direction * apothem };
    const startAngle = direction === -1 ? Math.PI + Math.PI / sides : -Math.PI / sides;
    const points = [];

    for (let i = 0; i < sides; i += 1) {
      const angle = startAngle - (Math.PI * 2 * i) / sides;
      points.push(
        point3(
          center.x + radius * Math.cos(angle),
          center.y + radius * Math.sin(angle),
          0
        )
      );
    }

    return points;
  }

  function regularPolygonCentered(sides, edgeLength) {
    const radius = edgeLength / (2 * Math.sin(Math.PI / sides));
    const rotation = -Math.PI / 2;
    const points = [];

    for (let i = 0; i < sides; i += 1) {
      const angle = rotation + (Math.PI * 2 * i) / sides;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }

    return points;
  }

  function polygonName(sides) {
    return (
      {
        3: "triangle",
        4: "square",
        5: "pentagon",
        6: "hexagon",
      }[sides] || "polygon"
    );
  }

  function centerScene(scene) {
    const allPoints = [
      ...scene.faces.flatMap((face) => face.points),
      ...scene.hinges.flatMap((hinge) => hinge),
    ];
    const centroid = {
      x: average(allPoints.map((point) => point.x)),
      y: average(allPoints.map((point) => point.y)),
      z: average(allPoints.map((point) => point.z)),
    };

    return {
      faces: scene.faces.map((face) => ({
        ...face,
        points: face.points.map((point) => ({
          x: point.x - centroid.x,
          y: point.y - centroid.y,
          z: point.z - centroid.z,
        })),
      })),
      hinges: scene.hinges.map((hinge) =>
        hinge.map((point) => ({
          x: point.x - centroid.x,
          y: point.y - centroid.y,
          z: point.z - centroid.z,
        }))
      ),
    };
  }

  function projectRaw(point) {
    const distance = 1100;
    const perspective = distance / (distance - point.z);
    return {
      x: point.x * perspective,
      y: point.y * perspective,
    };
  }

  function projectToViewport(
    point,
    scale,
    bounds = { minX: 0, minY: 0, width: 0, height: 0 }
  ) {
    return {
      x: 500 + (point.x - (bounds.minX + bounds.width / 2)) * scale,
      y: 350 + (point.y - (bounds.minY + bounds.height / 2)) * scale,
    };
  }

  function buildTeachingLabels(projectedFaces) {
    if (!projectedFaces.length) {
      return [];
    }

    const frontFace = projectedFaces[projectedFaces.length - 1];
    const faceAnchor = centroid2D(frontFace.projected);
    const faceLabel = {
      kind: "face",
      anchor: faceAnchor,
      tip: clampPoint({ x: faceAnchor.x + 82, y: faceAnchor.y - 70 }),
      color: "#f4b841",
    };

    const edgeCandidates = faceEdges(frontFace.projected);
    edgeCandidates.sort((a, b) => b.length - a.length);
    const bestEdge = edgeCandidates[0];
    const edgeMid = midpoint2D(bestEdge.start, bestEdge.end);
    const edgeLabel = {
      kind: "edge",
      anchor: edgeMid,
      line: [bestEdge.start, bestEdge.end],
      tip: clampPoint({ x: edgeMid.x + 110, y: edgeMid.y + 12 }),
      color: "#4c79d5",
    };

    const visibleVertices = projectedFaces
      .flatMap((face) =>
        face.points.map((point, index) => ({
          projected: face.projected[index],
          depth: point.z,
        }))
      )
      .sort((a, b) => b.depth - a.depth);
    const bestVertex = visibleVertices[0].projected;
    const vertexLabel = {
      kind: "vertex",
      anchor: bestVertex,
      tip: clampPoint({ x: bestVertex.x - 112, y: bestVertex.y - 30 }),
      color: "#e15aa3",
    };

    return [faceLabel, edgeLabel, vertexLabel];
  }

  function drawTeachingLabels(labels) {
    labels.forEach((label) => {
      if (label.line) {
        const edgeFocus = document.createElementNS(SVG_NS, "line");
        edgeFocus.setAttribute("x1", label.line[0].x);
        edgeFocus.setAttribute("y1", label.line[0].y);
        edgeFocus.setAttribute("x2", label.line[1].x);
        edgeFocus.setAttribute("y2", label.line[1].y);
        edgeFocus.setAttribute("stroke", label.color);
        edgeFocus.setAttribute("stroke-width", "5");
        edgeFocus.setAttribute("stroke-linecap", "round");
        svg.appendChild(edgeFocus);
      }

      const focus = document.createElementNS(SVG_NS, "circle");
      focus.setAttribute("cx", label.anchor.x);
      focus.setAttribute("cy", label.anchor.y);
      focus.setAttribute("r", label.kind === "vertex" ? "7.5" : "6");
      focus.setAttribute("fill", "#ffffff");
      focus.setAttribute("stroke", label.color);
      focus.setAttribute("stroke-width", "4");
      svg.appendChild(focus);

      const leader = document.createElementNS(SVG_NS, "line");
      leader.setAttribute("x1", label.anchor.x);
      leader.setAttribute("y1", label.anchor.y);
      leader.setAttribute("x2", label.tip.x);
      leader.setAttribute("y2", label.tip.y);
      leader.setAttribute("stroke", shadeColor(label.color, -0.2));
      leader.setAttribute("stroke-width", "3");
      leader.setAttribute("stroke-dasharray", "6 8");
      leader.setAttribute("stroke-linecap", "round");
      svg.appendChild(leader);

      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("filter", "url(#labelShadow)");

      const badgeWidth = label.kind === "vertex" ? 118 : 104;
      const badgeHeight = 42;
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", label.tip.x - badgeWidth / 2);
      rect.setAttribute("y", label.tip.y - badgeHeight / 2);
      rect.setAttribute("width", badgeWidth);
      rect.setAttribute("height", badgeHeight);
      rect.setAttribute("rx", "18");
      rect.setAttribute("fill", "rgba(255,255,255,0.96)");
      rect.setAttribute("stroke", label.color);
      rect.setAttribute("stroke-width", "2.5");
      group.appendChild(rect);

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", label.tip.x);
      text.setAttribute("y", label.tip.y + 6);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Trebuchet MS, Gill Sans, sans-serif");
      text.setAttribute("font-size", "22");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "#192534");
      text.textContent = capitalize(label.kind);
      group.appendChild(text);

      svg.appendChild(group);
    });
  }

  function get2DBounds(points) {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function midpoint2D(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampPoint(point) {
    return {
      x: clamp(point.x, 90, 910),
      y: clamp(point.y, 70, 630),
    };
  }

  function centroid2D(points) {
    return {
      x: average(points.map((point) => point.x)),
      y: average(points.map((point) => point.y)),
    };
  }

  function centroid3D(points) {
    return {
      x: average(points.map((point) => point.x)),
      y: average(points.map((point) => point.y)),
      z: average(points.map((point) => point.z)),
    };
  }

  function faceEdges(points) {
    const edges = [];
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      edges.push({
        start,
        end,
        length: Math.hypot(end.x - start.x, end.y - start.y),
      });
    }
    return edges;
  }

  function faceNormal(points) {
    const [a, b, c] = points;
    const ab = {
      x: b.x - a.x,
      y: b.y - a.y,
      z: b.z - a.z,
    };
    const ac = {
      x: c.x - a.x,
      y: c.y - a.y,
      z: c.z - a.z,
    };
    return normalize3({
      x: ab.y * ac.z - ab.z * ac.y,
      y: ab.z * ac.x - ab.x * ac.z,
      z: ab.x * ac.y - ab.y * ac.x,
    });
  }

  function faceLighting(normal) {
    const light = normalize3({ x: -0.5, y: -0.9, z: 1 });
    return dot3(normal, light) * 0.18 + 0.03;
  }

  function rotatePoint(point, rotationX, rotationY) {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const x1 = point.x * cosY + point.z * sinY;
    const z1 = -point.x * sinY + point.z * cosY;
    const y1 = point.y * cosX - z1 * sinX;
    const z2 = point.y * sinX + z1 * cosX;

    return { x: x1, y: y1, z: z2 };
  }

  function normalize2(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / length, y: vector.y / length };
  }

  function normalize3(vector) {
    const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length,
    };
  }

  function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function point3(x, y, z) {
    return { x, y, z };
  }

  function identity() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  function multiply(a, b) {
    const out = new Array(16).fill(0);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        for (let k = 0; k < 4; k += 1) {
          out[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
        }
      }
    }
    return out;
  }

  function translate(x, y, z) {
    return [
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1,
    ];
  }

  function rotateX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1,
    ];
  }

  function rotateY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1,
    ];
  }

  function basisFromAxes(xAxis, yAxis, zAxis) {
    return [
      xAxis.x, yAxis.x, zAxis.x, 0,
      xAxis.y, yAxis.y, zAxis.y, 0,
      xAxis.z, yAxis.z, zAxis.z, 0,
      0, 0, 0, 1,
    ];
  }

  function applyMatrix(matrix, point) {
    return {
      x:
        matrix[0] * point.x +
        matrix[1] * point.y +
        matrix[2] * point.z +
        matrix[3],
      y:
        matrix[4] * point.x +
        matrix[5] * point.y +
        matrix[6] * point.z +
        matrix[7],
      z:
        matrix[8] * point.x +
        matrix[9] * point.y +
        matrix[10] * point.z +
        matrix[11],
    };
  }

  function shadeColor(hex, amount) {
    const value = hex.replace("#", "");
    const num = Number.parseInt(value, 16);
    const adjust = (channel) =>
      clamp(Math.round(channel + 255 * amount), 0, 255)
        .toString(16)
        .padStart(2, "0");

    const r = adjust((num >> 16) & 255);
    const g = adjust((num >> 8) & 255);
    const b = adjust(num & 255);
    return `#${r}${g}${b}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
})();
