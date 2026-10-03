"""Direct-mode tests for OpenCriteriaGrants"""

import json

import pytest

CONTRACT = "contracts/grantkit.py"
CRITERIA = "Fund public goods with a working prototype and a public repository."
ONE = 10**18


def deploy(direct_vm, direct_deploy, owner, deposit=0):
    direct_vm.sender = owner
    direct_vm.value = 0
    return direct_deploy(
        CONTRACT,
        CRITERIA,
        3,
        3,
        1000,
        deposit,
        4,
        2,
        14,
        sdk_version="v0.2.16",
    )


def pay(direct_vm, amount):
    direct_vm.value = amount


def rejects(direct_vm, match):
    try:
        return direct_vm.expect_revert(match)
    except Exception:
        return pytest.raises((AssertionError, Exception), match=match)


def mock_pass(direct_vm, word="PASS"):
    direct_vm.mock_web(
        r"example\.com/project",
        {"status": 200, "body": "Public repository and working prototype notes for the grant."},
    )
    direct_vm.mock_llm(r"impartial grant evaluator", word)


def submit(contract, direct_vm, amount=100):
    pay(direct_vm, 0)
    return contract.submit_proposal(
        "Public goods prototype",
        "A working prototype with a public repository and a written milestone plan.",
        json.dumps(["https://example.com/project"]),
        json.dumps(["Ship the prototype", "Publish the repository"]),
        amount,
    )


def test_constructor_rejects_bad_fee_range(direct_vm, direct_deploy, direct_owner):
    direct_vm.sender = direct_owner
    with pytest.raises((AssertionError, Exception), match="pass_tier must be"):
        direct_deploy(CONTRACT, CRITERIA, 1, 3, 1000, 0, 4, 2, 14, sdk_version="v0.2.16")


def test_fund_and_views(direct_vm, direct_deploy, direct_owner):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    treasury = contract.get_treasury()
    config = contract.get_config()
    assert int(treasury["pool"]) == 500
    assert int(treasury["escrowed"]) == 0
    assert int(config["pass_tier"]) == 3
    assert config["pass_tier_name"] == "PASS"
    assert contract.get_owner() == config["owner"]
    assert contract.get_proposal(1)["found"] is False


def test_submit_rejects_bad_inputs(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    direct_vm.sender = direct_alice
    pay(direct_vm, 0)
    with pytest.raises((AssertionError, Exception), match="invalid title length"):
        contract.submit_proposal(" ", "A long enough pitch for the form.", json.dumps(["https://example.com/project"]), json.dumps(["Ship it"]), 10)
    with pytest.raises((AssertionError, Exception), match="invalid or disallowed link"):
        contract.submit_proposal("Public goods prototype", "A long enough pitch for the form.", json.dumps(["http://example.com/project"]), json.dumps(["Ship it"]), 10)
    with pytest.raises((AssertionError, Exception), match="insufficient grant pool"):
        contract.submit_proposal("Public goods prototype", "A long enough pitch for the form.", json.dumps(["https://example.com/project"]), json.dumps(["Ship it"]), 600)


def test_owner_cannot_apply(direct_vm, direct_deploy, direct_owner):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()
    with pytest.raises((AssertionError, Exception), match="owner cannot apply"):
        submit(contract, direct_vm)


def test_passing_proposal_escrows_remainder(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    direct_vm.sender = direct_alice
    direct_vm.warp("2026-10-03T00:00:00Z")
    mock_pass(direct_vm, "PASS")
    pid = submit(contract, direct_vm, 100)

    row = contract.get_proposal(int(pid))
    assert row["found"] is True
    assert row["status"] == "approved"
    assert row["tier"] == "PASS"
    assert int(row["released"]) == 50
    assert int(row["next_milestone"]) == 1
    assert int(contract.get_treasury()["pool"]) == 400
    assert int(contract.get_treasury()["escrowed"]) == 50
    assert contract.get_latest_proposal_id(row["applicant"]) == 1


def test_failing_proposal_keeps_pool(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    direct_vm.sender = direct_alice
    mock_pass(direct_vm, "FAIL")
    pid = submit(contract, direct_vm, 100)

    row = contract.get_proposal(int(pid))
    assert row["status"] == "rejected"
    assert row["tier"] == "FAIL"
    assert int(contract.get_treasury()["pool"]) == 500
    assert int(contract.get_treasury()["escrowed"]) == 0


def test_stranger_cannot_submit_milestone(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()
    direct_vm.sender = direct_alice
    mock_pass(direct_vm, "PASS")
    pid = int(submit(contract, direct_vm, 100))

    direct_vm.sender = direct_bob
    with pytest.raises((AssertionError, Exception), match="only the applicant can submit milestones"):
        contract.submit_milestone(pid, "https://example.com/project", "Second milestone is shipped")


def test_milestone_pass_completes_grant(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()
    direct_vm.sender = direct_alice
    mock_pass(direct_vm, "PASS")
    pid = int(submit(contract, direct_vm, 100))

    direct_vm.clear_mocks()
    mock_pass(direct_vm, "PASS")
    contract.submit_milestone(pid, "https://example.com/project", "Repository is public and the prototype runs")

    row = contract.get_proposal(pid)
    assert row["status"] == "completed"
    assert int(row["released"]) == 100
    assert int(contract.get_treasury()["escrowed"]) == 0


def test_only_owner_can_withdraw(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    direct_vm.sender = direct_alice
    with pytest.raises((AssertionError, Exception), match="only the owner can call this"):
        contract.withdraw_pool(100)

    direct_vm.sender = direct_owner
    contract.withdraw_pool(100)
    assert int(contract.get_treasury()["pool"]) == 400


def test_milestone_uses_criteria_frozen_at_approval(direct_vm, direct_deploy, direct_owner, direct_alice):
    contract = deploy(direct_vm, direct_deploy, direct_owner)
    pay(direct_vm, 500)
    contract.fund()

    direct_vm.sender = direct_alice
    mock_pass(direct_vm, "PASS")
    pid = int(submit(contract, direct_vm, 100))
    frozen = contract.get_proposal(pid)["criteria"]
    assert frozen == CRITERIA

    direct_vm.sender = direct_owner
    direct_vm.value = 0
    contract.set_criteria("Completely different rubric about closed source mobile apps only.")
    assert contract.get_config()["criteria"] != frozen
    assert contract.get_proposal(pid)["criteria"] == frozen

    direct_vm.sender = direct_alice
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r"example\.com/project",
        {"status": 200, "body": "Public repository and working prototype notes for the grant."},
    )
    direct_vm.mock_llm(r"working prototype and a public repository", "PASS")
    contract.submit_milestone(pid, "https://example.com/project", "Repository is public and the prototype runs")

    row = contract.get_proposal(pid)
    assert row["status"] == "completed"
    assert row["criteria"] == CRITERIA


def test_large_amount_survives_write_and_read(direct_vm, direct_deploy, direct_owner):
    amount = 10**20 + 123
    direct_vm.sender = direct_owner
    direct_vm.value = 0
    contract = direct_deploy(
        CONTRACT,
        CRITERIA,
        3,
        3,
        amount,
        0,
        4,
        2,
        14,
        sdk_version="v0.2.16",
    )
    pay(direct_vm, amount)
    contract.fund()

    config = contract.get_config()
    treasury = contract.get_treasury()
    assert config["max_award"] == str(amount)
    assert treasury["pool"] == str(amount)
    assert treasury["escrowed"] == "0"
    assert int(treasury["pool"]) == amount


def test_deploy_script_supplies_eight_constructor_arguments():
    from pathlib import Path

    text = Path("deploy/deployScript.ts").read_text(encoding="utf-8")
    start = text.index("args:")
    body = text[start:text.index("]", start)]
    assert "args: []" not in text
    values = [line.strip().rstrip(",") for line in body.splitlines() if line.strip() and "args:" not in line]
    assert len(values) == 8