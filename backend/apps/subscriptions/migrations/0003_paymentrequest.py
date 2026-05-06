import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_monthlyusage'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('billing_cycle', models.CharField(
                    choices=[('monthly', 'Monthly'), ('annual', 'Annual')],
                    default='monthly', max_length=10,
                )),
                ('amount_dzd', models.DecimalField(decimal_places=2, max_digits=10)),
                ('ccp_or_rip', models.CharField(max_length=100)),
                ('transfer_reference', models.CharField(max_length=200)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending Review'), ('confirmed', 'Confirmed'), ('rejected', 'Rejected')],
                    db_index=True, default='pending', max_length=10,
                )),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('admin_notes', models.TextField(blank=True)),
                ('client', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payment_requests', to='accounts.clientprofile',
                )),
                ('plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT, to='subscriptions.plan',
                )),
                ('reviewed_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviewed_payments',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'payment_requests', 'ordering': ['-submitted_at']},
        ),
    ]
