import {
  matrix, matrixGet, matrixSet, matrixRowView, matrixGetRowView, matrixRowViewMul, matrixRowViewNormalize,
  matrixRowViewSet,
} from "./matrix";

export interface PolynomialFit {
  coefficients: number[];
  confidence: number;
}

export function polynomialFit(degree: number, x: number[], y: number[], w: number[]): PolynomialFit | null {
  if (degree > x.length) {
    return null;
  }

  const result: PolynomialFit = {
    coefficients: new Array<number>(degree + 1).fill(0),
    confidence: 0,
  };

  const m = x.length;
  const n = degree + 1;

  const a = matrix(n, m);
  for (let h = 0; h < m; h++) {
    matrixSet(a, 0, h, w[h]);
    for (let i = 0; i < n; i++) {
      matrixSet(a, i, h, matrixGet(a, i - 1, h) * x[h]);
    }
  }

  const q = matrix(n, m);
  const r = matrix(n, n);
  for (let j = 0; j < n; j++) {
    for (let h = 0; h < m; h++) {
      matrixSet(q, j, h, matrixGet(a, j, h));
    }
    for (let i = 0; i < j; i++) {
      const dot = matrixRowViewMul(matrixGetRowView(q, j), matrixGetRowView(q, i));
      for (let h = 0; h < m; h++) {
        matrixSet(q, j, h, matrixGet(q, j, h) - dot * matrixGet(q, i, h));
      }
    }

    const norm = matrixRowViewNormalize(matrixGetRowView(q, j));
    if (norm < 0.000001) {
      return null;
    }

    const inverseNorm = 1 / norm;
    for (let h = 0; h < m; h++) {
      matrixSet(q, j, h, matrixGet(q, j, h) * inverseNorm);
    }
    for (let i = 0; i < n; i++) {
      matrixSet(r, j, i, i < j ? 0.0 : matrixRowViewMul(matrixGetRowView(q, j), matrixGetRowView(a, i)));
    }
  }

  const wy = matrixRowView(new Array(m).fill(0), 0, m);
  for (let h = 0; h < m; h++) {
    matrixRowViewSet(wy, h, y[h] * w[h]);
  }
  for (let i = n - 1; i >= 0; i--) {
    result.coefficients[i] = matrixRowViewMul(matrixGetRowView(q, i), wy);
    for (let j = n - 1; j > i; j--) {
      result.coefficients[i] -= matrixGet(r, i, j) * result.coefficients[j];
    }
    result.coefficients[i] /= matrixGet(r, i, i);
  }

  let yMean = 0;
  for (let h = 0; h < m; h++) {
    yMean += y[h];
  }
  yMean /= m;

  let sumSquaredError = 0;
  let sumSquaredTotal = 0;
  for (let h = 0; h < m; h++) {
    let term = 1;
    let err = y[h] - result.coefficients[0];
    for (let i = 1; i < n; i++) {
      term *= x[h];
      err -= term * result.coefficients[i];
    }
    const ww = w[h] * w[h];
    const v = y[h] - yMean;
    sumSquaredError += ww * err * err;
    sumSquaredTotal += ww * v * v;
  }

  result.confidence = (sumSquaredTotal <= 0.000001) ?
    1 :
    1 - (sumSquaredError / sumSquaredTotal);

  return result;
}