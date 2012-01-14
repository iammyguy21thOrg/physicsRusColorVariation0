//-------------------------------------------------------------------------------------------------
// Angle Joint
//
// C = a2 - a1 - initial_da
// dC/dt = w2 - w1
// J = [0, -1, 0, 1]
//-------------------------------------------------------------------------------------------------

AngleJoint = function(body1, body2) {
	Joint.call(this, body1, body2, false); // default not to collide with angle joint

	this.da = body2.a - body1.a;

	// accumulated lambda for angular velocity constraint
	this.lambda_acc = 0;
}

AngleJoint.prototype = new Joint;
AngleJoint.prototype.constructor = AngleJoint;

AngleJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// K = J * invM * JT
	var k = body1.i_inv + body2.i_inv;
	this.k_inv = k == 0 ? 0 : 1 / k;

	// max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// apply cached impulses
		// V += JT * lambda		
		body1.w -= this.lambda_acc * body1.i_inv;
		body2.w += this.lambda_acc * body2.i_inv;
	}
	else {
		this.lambda_acc = 0;
	}
}

AngleJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// compute lambda for velocity constraint
	// solve J * invM * JT * lambda = -J * v
	var jv = body2.w - body1.w;
	var lambda = this.k_inv * (-jv);

	// accumulate lambda for angular velocity constraint
	this.lambda_acc += lambda;

	// apply impulses
	// V += JT * lambda
	body1.w -= lambda * body1.i_inv;
	body2.w += lambda * body2.i_inv;
}

AngleJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// position (angle) constraint
	var c = body2.a - body1.a - this.da;
	var correction = Math.clamp(c, -this.max_angular_correction, this.max_angular_correction);

	// compute lambda for position (angle) constraint
	// solve J * invM * JT * lambda = -C
	var lambda = this.k_inv * (-correction);

	// apply impulses
	// X += JT * lambda * dt
	body1.a -= lambda * body1.i_inv;
	body2.a += lambda * body2.i_inv;

	return Math.abs(c) < Joint.ANGULAR_SLOP;
}

AngleJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.zero;
}

AngleJoint.prototype.getReactionTorque = function(dt_inv) {
	return this.lambda_acc * dt_inv;
}