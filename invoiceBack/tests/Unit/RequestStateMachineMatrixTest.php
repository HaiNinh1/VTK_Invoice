<?php

namespace Tests\Unit;

use App\Services\RequestStateMachine;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Locks the transition matrix in place. Failing this test = a deliberate FE-
 * spec change requiring documentation, not a bug.
 */
class RequestStateMachineMatrixTest extends TestCase
{
    /**
     * @return array<string, array{0:string, 1:string, 2:bool}>
     */
    public static function transitions(): array
    {
        return [
            // 7 valid transitions (FE-spec).
            'Nháp → Chờ duyệt' => ['Nháp', 'Chờ duyệt', true],
            'Chờ duyệt → Đã duyệt' => ['Chờ duyệt', 'Đã duyệt', true],
            'Chờ duyệt → Từ chối' => ['Chờ duyệt', 'Từ chối', true],
            'Chờ duyệt → Trả lại bổ sung' => ['Chờ duyệt', 'Trả lại bổ sung', true],
            'Chờ duyệt → Nháp (recall)' => ['Chờ duyệt', 'Nháp', true],
            'Đã duyệt → Đã xuất HĐ' => ['Đã duyệt', 'Đã xuất HĐ', true],
            'Trả lại bổ sung → Chờ duyệt' => ['Trả lại bổ sung', 'Chờ duyệt', true],

            // Invalid transitions.
            'Nháp → Đã duyệt (skip approval)' => ['Nháp', 'Đã duyệt', false],
            'Nháp → Đã xuất HĐ (skip everything)' => ['Nháp', 'Đã xuất HĐ', false],
            'Đã duyệt → Nháp (revert)' => ['Đã duyệt', 'Nháp', false],
            'Đã xuất HĐ → bất kỳ (terminal)' => ['Đã xuất HĐ', 'Nháp', false],
            'Từ chối → Chờ duyệt (terminal)' => ['Từ chối', 'Chờ duyệt', false],
            'Đã duyệt → Từ chối' => ['Đã duyệt', 'Từ chối', false],
        ];
    }

    #[DataProvider('transitions')]
    public function test_transition(string $from, string $to, bool $expected): void
    {
        $this->assertSame($expected, RequestStateMachine::canTransition($from, $to));
    }

    public function test_constants_match_fe_literals(): void
    {
        $this->assertSame('Nháp', RequestStateMachine::DRAFT);
        $this->assertSame('Chờ duyệt', RequestStateMachine::PENDING);
        $this->assertSame('Đã duyệt', RequestStateMachine::APPROVED);
        $this->assertSame('Đã xuất HĐ', RequestStateMachine::EXPORTED);
        $this->assertSame('Từ chối', RequestStateMachine::REJECTED);
        $this->assertSame('Trả lại bổ sung', RequestStateMachine::RETURNED);
    }
}
